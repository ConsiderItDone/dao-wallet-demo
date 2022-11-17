import { transactions, utils } from 'near-api-js';

/**
 * Interface for injected wallets from
 * https://github.com/near/NEPs/blob/master/specs/Standards/Wallets/InjectedWallets.md
 */

export interface InjectedWallet {
  id: string;
  initialized: boolean;
  connected: boolean;
  network: InjectedAPINetwork;
  accounts: Array<InjectedAPIAccount>;

  supportsNetwork(networkId: string): Promise<boolean>;
  connect(
    params?: InjectedAPIConnectParams,
  ): Promise<Array<InjectedAPIAccount>>;
  signIn(params: InjectedAPISignInParams): Promise<void>;
  signOut(params: InjectedAPISignOutParams): Promise<void>;
  signTransaction(
    params: InjectedAPISignTransactionParams,
  ): Promise<transactions.SignedTransaction>;
  signTransactions(
    params: InjectedAPISignTransactionsParams,
  ): Promise<Array<transactions.SignedTransaction>>;
  disconnect(): Promise<void>;
  on<EventName extends keyof InjectedAPIEvents>(
    event: EventName,
    callback: (params: InjectedAPIEvents[EventName]) => void,
  ): InjectedAPIUnsubscribe;
  off<EventName extends keyof InjectedAPIEvents>(
    event: EventName,
    callback?: (params: InjectedAPIEvents[EventName]) => void,
  ): void;
}

export interface InjectedAPIAccount {
  accountId: string;
  publicKey?: utils.PublicKey;
}

export interface InjectedAPINetwork {
  networkId: string;
  nodeUrl: string;
}

export interface InjectedAPISignInParams {
  permission: transactions.FunctionCallPermission;
  accounts: Array<InjectedAPIAccount>;
}

export interface InjectedAPISignOutParams {
  accounts: Array<InjectedAPIAccount>;
}

export interface InjectedAPITransactionOptions {
  receiverId: string;
  actions: Array<transactions.Action>;
  signerId?: string;
}

export interface InjectedAPISignTransactionParams {
  transaction: InjectedAPITransactionOptions;
}

export interface InjectedAPISignTransactionsParams {
  transactions: Array<InjectedAPITransactionOptions>;
}

export interface InjectedAPIEvents {
  accountsChanged: { accounts: Array<InjectedAPIAccount> };
  networkChanged: { network: InjectedAPINetwork };
}

export interface InjectedAPIConnectParams {
  networkId: string;
}

export type InjectedAPIUnsubscribe = () => void;
