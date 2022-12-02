import React, { useState } from 'react';
import { useNearWallet } from './hooks/useNearWallet';
import { ClipLoader } from 'react-spinners';
import { providers, transactions, utils } from 'near-api-js';

import { Buffer } from 'buffer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// @ts-ignore
window.Buffer = Buffer;

function App() {
  const {
    connectedAccounts,
    network,
    connect,
    disconnect,
    signTransaction,
    signTransactions,
  } = useNearWallet();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isChangingNetwork, setIsChangingNetwork] = useState<boolean>(false);

  const [signedTransactions, setSignedTransactions] = useState(null);

  const handleConnectAccounts = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('[HandleConnectAccounts]', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleConnectToTestnet = async () => {
    setIsChangingNetwork(true);
    try {
      await connect({ networkId: 'testnet' });
    } catch (error) {
      console.error('[HandleConnectToTestnet]', error);
    } finally {
      setIsChangingNetwork(false);
    }
  };

  const handleConnectToMainnet = async () => {
    setIsChangingNetwork(true);
    try {
      await connect({ networkId: 'mainnet' });
    } catch (error) {
      console.error('[HandleConnectToMainnet]', error);
    } finally {
      setIsChangingNetwork(false);
    }
  };

  const handleConnectToUnsupportedNetwork = async () => {
    setIsChangingNetwork(true);
    try {
      await connect({ networkId: 'random-network-123' });
    } catch (error) {
      console.error('[HandleConnectToUnsupportedNetwork]', error);
    } finally {
      setIsChangingNetwork(false);
    }
  };

  const handleSignTransaction = async () => {
    try {
      // Setup RPC to retrieve transaction-related prerequisites.
      const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

      // const [block, accessKey] = await Promise.all([
      //   provider.block({ finality: 'final' }),
      //   provider.query<AccessKeyView>({
      //     request_type: 'view_access_key',
      //     finality: 'final',
      //     account_id: connectedAccounts[0].accountId,
      //     public_key: connectedAccounts[0].publicKey.toString(),
      //   }),
      // ]);*/
      //
      // /*const transaction = transactions.createTransaction(
      //   connectedAccounts[0].accountId,
      //   connectedAccounts[0].publicKey,
      //   'polydev.testnet',
      //   accessKey.nonce + 1,
      //   [
      //     transactions.functionCall(
      //       'addMessage',
      //       { text: 'Hello World!' },
      //       utils.format.parseNearAmount('0.00000000003'),
      //       utils.format.parseNearAmount('0'),
      //     ),
      //   ],
      //   utils.serialize.base_decode(block.header.hash),
      // );

      const transaction = {
        receiverId: 'polydev.testnet',
        signerId: connectedAccounts[0].accountId,
        actions: [
          transactions.functionCall(
            'addMessage',
            { text: 'Hello World!' },
            utils.format.parseNearAmount('0.00000000003'),
            utils.format.parseNearAmount('0'),
          ),
        ],
      };
      console.log('Signing transaction', { transaction });

      const signedTx = await signTransaction({
        transaction,
      });
      setSignedTransactions([signedTx]);
      console.log('Signed transaction:', signedTx);

      // Send the transaction to the blockchain.
      // TODO: create polywrap client and send signed transaction
      await provider.sendTransaction(signedTx);
    } catch (error) {
      console.error('[HandleSignTransaction]', error);
      toast.error(error?.message || 'Failed to sign and send');
    }
  };

  const handleSignTwoTransactions = async () => {
    try {
      const transaction = {
        receiverId: 'polydev.testnet',
        signerId: connectedAccounts[0].accountId,
        actions: [
          transactions.functionCall(
            'addMessage',
            { text: 'Hello World!' },
            utils.format.parseNearAmount('0.00000000003'),
            utils.format.parseNearAmount('0'),
          ),
        ],
      };
      const transaction2 = {
        receiverId: 'polydev24.testnet',
        signerId: connectedAccounts[0].accountId,
        actions: [
          transactions.functionCall(
            'sendMoney',
            { text: 'Hello World!' },
            utils.format.parseNearAmount('0.00000000004'),
            utils.format.parseNearAmount('0'),
          ),
        ],
      };
      const transactionsArray = [transaction, transaction2];
      console.log('Signing transactions:', transactionsArray);

      const signedTransactions = await signTransactions({
        transactions: transactionsArray,
      });
      setSignedTransactions(signedTransactions);
      console.log('Signed transactions:', signedTransactions);
    } catch (error) {
      console.error('[HandleSignTransactions]', error);
      toast.error(error?.message || 'Failed to sign and send');
    }
  };

  const handleSignThreeTransactions = async () => {
    try {
      const transaction = {
        receiverId: 'polydev.testnet',
        signerId: connectedAccounts[0].accountId,
        actions: [
          transactions.functionCall(
            'addMessage',
            { text: 'Hello World!' },
            utils.format.parseNearAmount('0.00000000003'),
            utils.format.parseNearAmount('0'),
          ),
        ],
      };
      const transaction2 = {
        receiverId: '123.testnet',
        signerId: connectedAccounts[0].accountId,
        actions: [
          transactions.functionCall(
            'sendMoney',
            { text: 'A lot of money' },
            utils.format.parseNearAmount('0.00000000004'),
            utils.format.parseNearAmount('0'),
          ),
        ],
      };
      const transaction3 = {
        receiverId: '456.testnet',
        signerId: connectedAccounts[0].accountId,
        actions: [
          transactions.functionCall(
            'updateStatus',
            { text: 'admin' },
            utils.format.parseNearAmount('0.00000000005'),
            utils.format.parseNearAmount('0'),
          ),
        ],
      };
      const transactionsArray = [transaction, transaction2, transaction3];
      console.log('Signing transactions:', transactionsArray);

      const signedTransactions = await signTransactions({
        transactions: transactionsArray,
      });
      setSignedTransactions(signedTransactions);
      console.log('Signed transactions:', signedTransactions);
    } catch (error) {
      console.error('[HandleSignTransactions]', error);
      toast.error(error?.message || 'Failed to sign and send');
    }
  };

  return (
    <div className="bg-[#282c34] min-h-screen text-white">
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col p-5">
          <div className="w-fit mx-auto text-2xl font-bold">
            Connected Accounts
          </div>
          <div className="flex flex-col gap-4 mt-5 w-fit mx-auto">
            {connectedAccounts && connectedAccounts?.length
              ? connectedAccounts.map((account, index) => (
                  <div className="flex justify-center items-center" key={index}>
                    <div className="ml-1">
                      <div className="whitespace-nowrap max-w-[400px] overflow-hidden text-ellipsis text-green-300">
                        Account ID: {account.accountId}
                      </div>
                      <div className="whitespace-nowrap max-w-[400px] overflow-hidden text-ellipsis text-blue-300">
                        Public Key: {account.publicKey?.toString()}
                      </div>
                    </div>
                  </div>
                ))
              : 'No Accounts'}
          </div>
        </div>
        <div className="flex flex-wrap m-auto gap-4">
          <button
            onClick={handleConnectAccounts}
            className="mt-2 w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[160px]"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect Accounts'
            )}
          </button>
          <button
            onClick={handleDisconnect}
            className="mt-2 w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[160px]"
            disabled={isConnecting}
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="h-0.5 bg-gray-500 w-[100%] rounded-[10px]" />
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col p-5">
          <div className="w-fit mx-auto text-2xl font-bold">Network</div>
          <div className="flex flex-col gap-4 mt-5 w-fit mx-auto">
            {network ? (
              <div className="flex flex-col text-center">
                <div className="text-cyan-300">
                  Network ID: {network.networkId}
                </div>
                <div className="text-amber-300">
                  Node URL: {network.nodeUrl}
                </div>
              </div>
            ) : (
              <div className="text-center">No Network</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap m-auto gap-4">
          <button
            onClick={handleConnectToTestnet}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isChangingNetwork}
          >
            {isChangingNetwork ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Testnet'
            )}
          </button>
          <button
            onClick={handleConnectToMainnet}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isChangingNetwork}
          >
            {isChangingNetwork ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Mainnet'
            )}
          </button>
          <button
            onClick={handleConnectToUnsupportedNetwork}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isChangingNetwork}
          >
            {isChangingNetwork ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Unsupported'
            )}
          </button>
        </div>
      </div>

      <div className="h-0.5 bg-gray-500 w-[100%] rounded-[10px]" />
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col p-5">
          <div className="w-fit mx-auto text-2xl font-bold">
            Signed Transaction
          </div>
          <div className="flex flex-col gap-4 mt-5 w-fit mx-auto">
            {signedTransactions ? (
              signedTransactions.map((signedTransaction, index) => (
                <div className="flex flex-col text-center" key={index}>
                  <div className="mx-auto rounded-[50%] text-white font-extrabold text-[26px]">
                    {index + 1} Transaction
                  </div>
                  <div className="text-blue-400">
                    Signature:{' '}
                    {JSON.stringify(signedTransaction?.signature, null, 4)}
                  </div>
                  <div className="text-fuchsia-400 mt-1">
                    Transaction:{' '}
                    {JSON.stringify(signedTransaction?.transaction, null, 4)}
                  </div>
                  <div className="h-0.5 bg-gray-500 w-[100%] rounded-[10px]" />
                </div>
              ))
            ) : (
              <div className="text-center">No Signed Transaction</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap m-auto gap-4">
          <button
            onClick={handleSignTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
          >
            Sign Transaction
          </button>
          <button
            onClick={handleSignTwoTransactions}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
          >
            Sign Two Transactions
          </button>
          <button
            onClick={handleSignThreeTransactions}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
          >
            Sign Three Transactions
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
