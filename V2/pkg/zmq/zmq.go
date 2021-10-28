package zmq

import (
	"encoding/binary"
	"encoding/hex"
	"time"

	"github.com/pebbe/zmq4"
	"github.com/pkg/errors"
	"github.com/shapeshift-legacy/coinquery/V2/config"
	"github.com/shapeshift-legacy/coinquery/V2/internal/log"
	"github.com/shapeshift-legacy/coinquery/V2/pkg/blockchain/utxo"
)

var (
	txChan    = make(chan string)
	blockChan = make(chan string)
)

// ZMQ type to hold configuration details
type ZMQ struct {
	timeout  int64
	subURL   string
	subs     []string
	sub      *zmq4.Socket
	doneChan chan struct{}
	errChan  chan error
}

// New returns a ZMQ object configured for a specific coin
func New(c *config.Coin, doneChan chan struct{}, errChan chan error) *ZMQ {
	return &ZMQ{
		timeout:  c.ZMQ.Timeout,
		subURL:   c.ZMQ.SubURL,
		subs:     c.ZMQ.Subscriptions,
		doneChan: doneChan,
		errChan:  errChan,
	}
}

// Connect will create a new ZMQ socket, connect to the endpoint and subscribe to the desired topics
func (z *ZMQ) Connect() error {
	sub, err := zmq4.NewSocket(zmq4.SUB)
	if err != nil {
		return errors.Wrap(err, "failed to create new subscription socket")
	}

	err = sub.SetRcvtimeo(time.Duration(z.timeout) * time.Second)
	if err != nil {
		return errors.Wrapf(err, "failed to to set recv timeout to: %v seconds", z.timeout)
	}

	err = sub.Connect(z.subURL)
	if err != nil {
		return errors.Wrapf(err, "failed to connect to subscription url: %s", z.subURL)
	}
	log.Infof("zmq", "connected to: %s", z.subURL)

	for _, s := range z.subs {
		err = sub.SetSubscribe(s)
		if err != nil {
			return errors.Wrapf(err, "failed to subscribe to topic: %s", s)
		}
		log.Infof("zmq", "subscribed to: %s", s)
	}

	z.sub = sub

	return nil
}

// Start kicks off the listener and will monitor the traffic and ingest
func (z *ZMQ) Start(blockHashChan chan<- interface{}, mempoolTxChan chan<- *utxo.MempoolTx, signalMempoolChan chan struct{}) {
	go func() {
		for {
			select {
			case hash := <-blockChan:
				go func(hash string) {
					log.Infof("zmq", "block received: %s", hash)
					blockHashChan <- []string{hash}
				}(hash)
			case hash := <-txChan:
				go func(hash string) {
					log.Debugf("zmq", "tx received: %s", hash)
					mempoolTxChan <- &utxo.MempoolTx{Hash: hash, Fails: 0}
				}(hash)
			case <-z.doneChan:
				close(blockHashChan)
				close(mempoolTxChan)
				return
			}
		}
	}()

	go z.listen(blockHashChan, signalMempoolChan)
}

// listen is responsible for listening to subscription messages, decode them and fill the ingestion channels accordingly.
// If RecvMessageBytes receives an error, connect to a new socket, subscribe and begin listening again.
// To ensure no data was missed during reconnect, signal mempool to process again as well.
func (z *ZMQ) listen(blockHashChan chan<- interface{}, signalMempoolChan chan<- struct{}) {
	for {
		msg, err := z.sub.RecvMessageBytes(0)
		if err != nil {
			log.Warn(err, "zmq", "reconnecting")
			z.Connect()
			signalMempoolChan <- struct{}{}
			blockHashChan <- struct{}{}
			continue
		}

		topic := string(msg[0])
		body := hex.EncodeToString(msg[1])
		_ = binary.LittleEndian.Uint32(msg[2]) // sequence number

		select {
		case <-z.doneChan:
			close(blockChan)
			close(txChan)
		default:
			switch topic {
			case "hashblock":
				blockChan <- body
			case "hashtx":
				txChan <- body
			}
		}
	}
}
