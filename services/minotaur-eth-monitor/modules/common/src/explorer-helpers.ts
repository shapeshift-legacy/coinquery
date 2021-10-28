import { Collection } from 'vineyard-data/legacy'

export function getTransactionByTxid<Tx>(
  transactionCollection: Collection<Tx>,
  txid: string
): Promise<Tx | undefined> {
  return transactionCollection.first({ txid }).exec()
}
