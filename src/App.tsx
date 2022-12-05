import React, { useState } from 'react';
import { useNearWallet } from './hooks/useNearWallet';
import { ClipLoader } from 'react-spinners';
import { providers, transactions, utils } from 'near-api-js';

import { Buffer } from 'buffer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AccessKeyView } from 'near-api-js/lib/providers/provider';
import { getRandomInt } from './utils/common';

// @ts-ignore
window.Buffer = Buffer;

const receiverAccountId = 'polydev.testnet';
const extraPublicKey = 'ed25519:3kqMb6ZU2j2fCT2nm4LFDtDfqSJcJwCSpGodXmbgx58m';

function App() {
  const {
    connectedAccounts,
    network,
    connect,
    connected,
    disconnect,
    signTransaction,
    signTransactions,
  } = useNearWallet();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSigningTransactions, setIsSigningTransactions] =
    useState<boolean>(false);

  const [signedTransactions, setSignedTransactions] = useState(null);

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleConnect = async (networkId?: string) => {
    setIsConnecting(true);
    try {
      await connect({ networkId: networkId || undefined });
    } catch (error) {
      console.error('[HandleConnect]', error);
      toast.error(
        error?.message ||
          `Failed to connect${networkId ? ` to ${networkId}` : ''}`,
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectAccounts = async () => handleConnect();
  const handleConnectToTestnet = async () => handleConnect('testnet');
  const handleConnectToMainnet = async () => handleConnect('mainnet');
  const handleConnectToUnsupportedNetwork = async () =>
    handleConnect('random-network-123');

  const getTransactionsData = async () => {
    if (!connected) {
      await handleConnect();
    }

    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    const [block, accessKey] = await Promise.all([
      provider.block({ finality: 'final' }),
      provider.query<AccessKeyView>({
        request_type: 'view_access_key',
        finality: 'final',
        account_id: connectedAccounts[0].accountId,
        public_key: connectedAccounts[0].publicKey.toString(),
      }),
    ]);

    return { provider, block, accessKey };
  };

  const signAndSendTransactions = async (transactions: any[]) => {
    setIsSigningTransactions(true);
    console.log('[HandleSignTransactions] signing:', transactions);
    try {
      // Setup RPC to retrieve transaction-related prerequisites.
      const { provider } = await getTransactionsData();

      let signedTransactions;
      if (transactions.length === 1) {
        signedTransactions = [
          await signTransaction({
            transaction: transactions[0],
          }),
        ];
      } else {
        signedTransactions = await signTransactions({
          transactions,
        });
      }
      setSignedTransactions(signedTransactions);
      console.log('[HandleSignTransactions] sign result:', signedTransactions);

      // Send transactions to the blockchain.
      if (signedTransactions?.length > 0) {
        for (const signedTransaction of signedTransactions) {
          await provider.sendTransaction(signedTransaction);
        }
      }
    } catch (error) {
      console.error('[HandleSignTransactions]', error);
      toast.error(error?.message || 'Failed to sign and send');
    } finally {
      setIsSigningTransactions(false);
    }
  };

  const handleSignFunctionCallTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [
        transactions.functionCall(
          'addMessage',
          { text: 'Hello World!' },
          utils.format.parseNearAmount('0.00000000003'),
          utils.format.parseNearAmount('0'),
        ),
      ],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  const handleSignCreateAccountTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    // TODO: try adding sub account (e.g. 123.polydev.tesnet)
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      `polydev${getRandomInt(100, 1000000)}.testnet`,
      (accessKey as any).nonce + 1,
      [transactions.createAccount()],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  const handleSignDeployContractTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [transactions.deployContract(Uint8Array.from([1, 2, 3]))],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  const handleSignTransferTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [transactions.transfer(1)],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  // TODO: check with real validator
  const handleSignStakeTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    // TODO: use real validator
    const validatorPublicKey = connectedAccounts[0].publicKey;
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [transactions.stake(1, validatorPublicKey)],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  // TODO: also add and test method for adding full access key
  const handleSignAddKeyTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    // Will result with error 'key already exist'
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [
        transactions.addKey(
          connectedAccounts[0].publicKey,
          transactions.functionCallAccessKey('zzz', ['www'], null),
        ),
      ],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  const handleSignDeleteKeyTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    const publicKey = utils.PublicKey.from(extraPublicKey);
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [transactions.deleteKey(publicKey)],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  // TODO: action delete account

  const handleSignTwoTransactions = async () => {
    const { accessKey, block } = await getTransactionsData();

    const transaction1 = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [transactions.deployContract(Uint8Array.from([1, 2, 3, 4]))],
      utils.serialize.base_decode(block.header.hash),
    );
    const transaction2 = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [transactions.transfer(utils.format.parseNearAmount('0.00000004'))],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction1, transaction2]);
  };

  const handleSignThreeTransactions = async () => {
    const { accessKey, block } = await getTransactionsData();

    const transaction1 = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [
        transactions.functionCall(
          'someMethod',
          { text: 'Hello World!' },
          utils.format.parseNearAmount('0.00000000003'),
          utils.format.parseNearAmount('0'),
        ),
      ],
      utils.serialize.base_decode(block.header.hash),
    );
    const transaction2 = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [
        transactions.functionCall(
          'sendMoney',
          { text: 'A lot of money' },
          utils.format.parseNearAmount('0.00000000004'),
          utils.format.parseNearAmount('0'),
        ),
      ],
      utils.serialize.base_decode(block.header.hash),
    );
    const transaction3 = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [
        transactions.functionCall(
          'updateStatus',
          { text: 'admin' },
          utils.format.parseNearAmount('0.00000000005'),
          utils.format.parseNearAmount('0'),
        ),
      ],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction1, transaction2, transaction3]);
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
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Testnet'
            )}
          </button>
          <button
            onClick={handleConnectToMainnet}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Mainnet'
            )}
          </button>
          <button
            onClick={handleConnectToUnsupportedNetwork}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isConnecting}
          >
            {isConnecting ? (
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
            onClick={handleSignFunctionCallTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">functionCall</span>{' '}
                Transaction
              </>
            )}
          </button>
          <button
            onClick={handleSignCreateAccountTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">createAccount</span>{' '}
                Transaction
              </>
            )}
          </button>
          <button
            onClick={handleSignDeployContractTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">deployContract</span>{' '}
                Transaction
              </>
            )}
          </button>
          <button
            onClick={handleSignTransferTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">transfer</span>{' '}
                Transaction
              </>
            )}
          </button>
          <button
            onClick={handleSignStakeTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">stake</span> Transaction
              </>
            )}
          </button>
          <button
            onClick={handleSignAddKeyTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">addKey</span> Transaction
              </>
            )}
          </button>
          <button
            onClick={handleSignDeleteKeyTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">deleteKey</span>{' '}
                Transaction
              </>
            )}
          </button>

          <button
            onClick={handleSignTwoTransactions}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-lime-400">Two</span> Transaction
              </>
            )}
          </button>
          <button
            onClick={handleSignThreeTransactions}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-lime-400">Three</span> Transaction
              </>
            )}
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
