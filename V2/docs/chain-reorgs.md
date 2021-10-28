# ------------- DRAFT ------------

# Blockchain Indexer  

## Blockchain Reorgs
Temporary forks can occur when two blocks are found simultaneously.  One half of the network builds on one fork and the other half builds on the other fork.  

Bitcoin forks are almost always resolved within one block.  Expect a 1 block fork about once a day and a 2 block fork every few weeks.  Currencies with faster block times will likely experience more forks (e.g Litecoin, Dogecoin).

Nodes always follow the chain with the most cummulative proof of work (typically the longest chain).  A fork is resolved when a new block is found on one of the forks before the other, making it the longest chain.

### Constraints
The indexer must function in normal conditions, as well as network attacks and hard forks.  The system handles arbitrary length reorgs.  

Some situations that cause blockchain reorgs:

- 51% Attack
- Selfish Mining Attack
- Eclipse Attack
- Consensus failure (unintentional hardfork)

### Architecture
The indexer receives new blocks via ZMQ notifications from the node.  Every time a new block is received, the block hash is posted to ZMQ.  Then the indexer requests the block details from the node.

Considered RPC polling vs ZMQ monitoring.

### Assumptions
1. All blocks received from the node are valid
1. ZMQ will not send two blocks with the same block number (node ignores second occurence because it's invalid).
2. When a reorg occurs, this is noted in the ZMQ stream, which will send all blocks from the new chain, beginning with the oldest.

### Terminology
- Child - the next block in the chain (current blockNumber + 1)
- Parent - the previous block in the chain (current blockNumber -1)
- Sibling - blocks with the same block number on different forks
- Uncle - sibling of a block's parent
- Orphan - blocks that don't have a parent (can happen when blocks received out of order)

### Algorithm

This is the algorithm for adding new blocks to database, accounting for blockchain reorgs.  When a blockchain reorg happens, the indexer goes back to invalid the old items and add/update the new items.

#### Pseudo-code

For new block N, call `addblock(N)`  This is a recursive function.

Option 1:  
When receive a block, call RPC `getchaintips` to see if there has been a reorg since the last block was added.  If so, invalidate any replaced blocks and add the new blocks.

Option 2: 
Detect the reorg --after-- add the new block to the db.  This is the option that is described below.


**Function: addBlock (block N)**

```
  If (parent exists in db)
    addItems(N.items)
    If (block N has siblings in db)
      return
    Else
      reorgBlock(N)
  Else
    return
```

**Function: reorgBlock (block N)**

```
    If (block N has no siblings)
      return
    Else
      validateBlock(parent)
      for s in siblings
        invalidateBlock(s)
        reorgBlock(N.parent.blockheight - 1, N.parent.prevhash)
```

**Function: addItem (item I)**  

```  
  add all items to the db  
```

**Function: validateBlock (block S)**  

```
  for i in items
    If (i.Output.Blockhash == S.blockhash)
      i.Output.Valid = true
    If (i.Input.Blockhash == S.blockhash)
      i.Input.Valid = true
```

**Function: invalidateBlock (block S)**  

```
  for i in items
    If (i.Output.Blockhash == S.blockhash)
      i.Output.Valid = false
    If (i.Input.Blockhash == S.blockhash)
      i.Input.Valid = false
```

#### Data Model

A database item is composed of two groups of data:  

1. UTXO created    
2. UTXO spent  

```
- Item (UTXO)
   - Created
     - TxID
     - Addr
     - Value
     - LockScript
     - CoinbaseData
     - BlockNumber 
     - BlockHash 
     - Timestamp 
     - Valid 
  - Spent
    - SpentTxID
    - Index
    - UnlockScript
    - Sequence
    - BlockNumber 
    - BlockHash 
    - Timestamp 
    - Valid 
```


### Example

The following example shows a temporary fork.  The order that the indexer receives the blocks is:

**Example: single block fork**

- 1000 - no new chaintips, added to the db as normal
- 1001 - no new chaintips, added to the db
- 1002 - no new chaintips, added to the db
- 1002' - new chaintip detected, invalidate any outputs spent in block 1002, invalidate any outputs created in block 1002.  add new items to the db
- 1003' - no new chaintips, add items to the db

```
              --1002'---1003' main branch
             /
    1000---1001---1002 orphaned block
```

**Example: multi-block fork**  

- 

**Example: re-reorg**  

- 

## Testing

Testing involves creating specific reorg scenarios in a test environment to verify that the indexer performs as expected.  Testing options: 
 
**Mainnet**  
Run the indexer on the mainnet and validate as blocks are recieved in realtime.

**Testnet**  
Run the indexer on the testnet and validate as blocks are recieved in realtime. 

**Regtest (local blockchain)**  
Create a local blockchain network with miners and full nodes.  Generate re-orgs via test scripts.  Useful for regression testing. 


**ZMQ Bus model**    
Send blocks to the indexer in same format as the node ZMQ


## Validation

Validation involves checking data written to production database to verify data integrity.  Validation options:
  
**Monitor the Dynamo DB stream**  
Perform checks whenever data is added to the db, for example no duplicate blocks, no double spends, item attributes valid format

**Assertions**  
Assertions in in the code

**Database Scrubbing**
Periodically scrub the database to check for duplicates, for example

**External Source**  
Compare to external source such as insight.bitpay.com, spot check blocks,
verify we are on the "right" fork


## References
Jameson Lopp - The Challenges of Block Chain Indexing  
[https://medium.com/@lopp/the-challenges-of-block-chain-indexing-30527cf4bfbd](https://medium.com/@lopp/the-challenges-of-block-chain-indexing-30527cf4bfbd)
