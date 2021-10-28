# Interpreting Data

## Transaction Data

Relevant transaction data may be found in the `cq_transactions` view on the database. This view may be queried for information concerning relevant addresses.

Example query:
```
SELECT 
    * 
FROM 
    cq_transactions 
WHERE 
    "to" = '0xca54DA70870875d0E4eb7c8BB8eb7aB1Da74479d' 
    OR "from" = '0xca54DA70870875d0E4eb7c8BB8eb7aB1Da74479d' 
ORDER BY 
    "blockIndex" DESC OFFSET 0 
LIMIT 
    100;
```

Returns:

* `hash`: string - hash of the transaction.
* `to`: string - address of the receiver. `null` in the case of a contract creation transaction.
* `from`: string - address of the sender.
* `amount`: big number - value transferred in Wei.
* `nonce`: number - the number of transactions made by the sender prior to this one.
* `v`: string - part of the transaction's signature.
* `r`: string - part of the transaction's signature.
* `s`: string - part of the transaction's signature.
* `inputData`: string - the data sent along with the transaction.
* `transactionIndex`: number - integer of the transaction's index position in the block.
* `blockIndex`: number - the number of the transaction's block. `null` when pending.
* `cumulativeGasUsed`: big number - the total amount of gas used when this transaction was executed in the block.
* `postRoot`: string - exists on pre-Byzantium transactions instead of the `status` field. It is the post-transaction stateroot.
* `status`: number - exists on post-Byzantium transactions instead of the `postRoot` field. Can be 1 (success) or 0 (failure).
* `gasUsed`: big number - the amount of gas used by this specific transaction alone.
* `logsBloom`: string - the bloom filter for the logs of the block. `null` when the block is pending.
* `timeReceived`: datetime - timestamp for when the transaction's block was collated.
* `blockHash`: string - the hash of the transactions's block. `null` when pending.
* `contractAddress`: string - the contract address created, if the transaction was a contract creation, otherwise `null`.
* `calledContract`: string - the contract address, if the transaction was a contract transaction, otherwise `null`.

## Validation Data

Validation data may be found in the `validation_records` table. This table may be queried for information on which blocks are valid versus invalid.

Example query:
```
SELECT 
    * 
FROM 
    validation_records 
LIMIT 
    100;
```

Returns:

* `blockIndex`: number - the index of the block being validated.
* `valid`: boolean - indication of whether the block's contents have passed validation.
* `data`: array - array of validation errors. Each item contains a `type` field and may contain a `target` field.
  * `type`: string - specifies which part of the block was invalid. Can be 'missingBlock', 'badTxRoot', or 'badTx'.
  * `target`: string - if a transaction was invalid, specifies the hash of the invalid transaction.

Note: to rescan an invalid block, use the [block rescan script](scripts.md#block-rescan).