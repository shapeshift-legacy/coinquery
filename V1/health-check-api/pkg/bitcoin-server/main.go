package healthcheck

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/gorilla/mux"
)

type BlockChainInfo struct {
	Headers int `json:"headers"`
}

type InsightStatus struct {
	Info struct {
		Blocks int `json:"blocks"`
	} `json:"info"`
}

var client *rpcclient.Client

func init() {
	// Connect to local bitcoin core RPC server using HTTP POST mode.
	connCfg := &rpcclient.ConnConfig{
		Host:         os.Getenv("RPC_HOST_N_PORT"),
		User:         os.Getenv("RPC_USER"),
		Pass:         os.Getenv("RPC_PASS"),
		HTTPPostMode: true, // Bitcoin core only supports HTTP POST mode
		DisableTLS:   true, // Bitcoin core does not provide TLS by default
	}
	// Notice the notification parameter is nil since notifications are
	// not supported in HTTP POST mode.
	var err error
	client, err = rpcclient.New(connCfg, nil)
	if err != nil {
		fmt.Println(err)
	}
}

func StartServer() {
	var router = mux.NewRouter()
	defer client.Shutdown()

	router.HandleFunc("/healthcheck", healthCheck).Methods("GET")

	fmt.Println("Running server!")
	fmt.Println(http.ListenAndServe(":3000", router))
}

func getBlockHeaderCount() int {
	// Get the Info from the blockchain mainly we care about header #.
	blockChainInfoResponse, err := client.GetBlockChainInfo()
	if err != nil {
		fmt.Println(err)
		return -1
	}
	blockChainInfoJson, err := json.Marshal(blockChainInfoResponse)
	blockChainInfo := BlockChainInfo{}
	json.Unmarshal([]byte(blockChainInfoJson), &blockChainInfo)
	return blockChainInfo.Headers
}

func getInsightBlockCount() int {
	url := fmt.Sprintf("%s/api/status", os.Getenv("INSIGHT_HOST_N_PORT"))

	insightClient := http.Client{
		Timeout: time.Second * 4, // Maximum of 4 secs
	}

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		fmt.Println(err)
		return -1
	}

	res, getErr := insightClient.Do(req)
	if getErr != nil {
		fmt.Println(getErr)
		return -1
	}

	body, readErr := ioutil.ReadAll(res.Body)
	if readErr != nil {
		fmt.Println(readErr)
		return -1
	}
	insightStatus := InsightStatus{}
	jsonErr := json.Unmarshal(body, &insightStatus)
	if jsonErr != nil {
		fmt.Println(jsonErr)
		return -1
	}

	return insightStatus.Info.Blocks
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	blockHeaders := getBlockHeaderCount()
	insightCount := getInsightBlockCount()
	if insightCount < blockHeaders || blockHeaders == -1 || insightCount == -1 {
		http.Error(
			w,
			fmt.Sprintf("insight: %d < blockchainHeaders: %d", insightCount, blockHeaders),
			http.StatusAccepted)
		return
	}
	json.NewEncoder(w).Encode(blockHeaders)
}
