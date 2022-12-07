import React, { useState } from 'react';
import { useDaoNearWallet } from './hooks/useDaoNearWallet';
import { ClipLoader } from 'react-spinners';
import { keyStores, providers, transactions, utils } from 'near-api-js';

import { Buffer } from 'buffer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AccessKeyView } from 'near-api-js/lib/providers/provider';

// @ts-ignore
window.Buffer = Buffer;

const receiverAccountId = 'polydev24.testnet';

const smartContractId = 'guest-book.testnet';
const smartContractMethods = ['write', 'add'];
const smartContractFirstMethodArgs = { text: 'Hello' };

const keyStorePrefix = 'daoWallet:keystore:';

function App() {
  const {
    connectedAccounts,
    network,
    connect,
    connected,
    disconnect,
    signTransaction,
    signTransactions,
    signIn,
    signOut,
  } = useDaoNearWallet();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSigningTransactions, setIsSigningTransactions] =
    useState<boolean>(false);
  const [isSigningInOrOut, setIsSigningInOrOut] = useState<boolean>(false);
  const [isTestingSignIn, setIsTestingSignIn] = useState<boolean>(false);

  const [signedTransactions, setSignedTransactions] = useState(null);
  const [testSignInResult, setTestSignInResult] = useState(null);

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

  const formatTransactionError = (error: any): string | undefined => {
    if (error?.message) {
      const msg = error?.message as string;
      if (
        msg.includes('access key') &&
        msg.includes('does not exist while viewing')
      ) {
        return 'Connected account is not funded';
      }
    }

    return error?.message;
  };

  const getTransactionsData = async () => {
    try {
      // TODO: test to work when was not connected initially
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
    } catch (error) {
      console.error('[GetTransactionsData]', error);
      const formattedErrorMessage = formatTransactionError(error);
      toast.error(formattedErrorMessage || 'Failed to get transactions data');
    }
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
      const formattedErrorMessage = formatTransactionError(error);
      toast.error(formattedErrorMessage || 'Failed to sign and send');
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

    // TODO: try adding sub account (e.g. subaccount.polydev.testnet)
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      '123', // will fail due to "accountAlreadyExists"
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

  const handleSignAddFunctionCallAccessKeyTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    const keyPair = utils.KeyPair.fromRandom('ed25519');
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      connectedAccounts[0].accountId,
      (accessKey as any).nonce + 1,
      [
        transactions.addKey(
          keyPair.getPublicKey(),
          transactions.functionCallAccessKey('zzz', ['www'], null),
        ),
      ],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  const handleSignAddFullAccessKeyTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    const keyPair = utils.KeyPair.fromRandom('ed25519');
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      connectedAccounts[0].accountId,
      (accessKey as any).nonce + 1,
      [
        transactions.addKey(
          keyPair.getPublicKey(),
          transactions.fullAccessKey(),
        ),
      ],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  const handleSignDeleteKeyTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    const keyPair = utils.KeyPair.fromRandom('ed25519');
    const transaction = transactions.createTransaction(
      connectedAccounts[0].accountId,
      connectedAccounts[0].publicKey,
      receiverAccountId,
      (accessKey as any).nonce + 1,
      [transactions.deleteKey(keyPair.getPublicKey())],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

  // TODO: add signing transaction with action `deleteAccount` (currently not added because it's dangerous)

  const handleSignManyActionsTransaction = async () => {
    const { accessKey, block } = await getTransactionsData();

    // TODO: use real validator
    const validatorPublicKey = connectedAccounts[0].publicKey;
    const keyPair = utils.KeyPair.fromRandom('ed25519');
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
        // transactions.createAccount(),
        transactions.deployContract(Uint8Array.from([1, 2, 3])),
        transactions.transfer(1),
        transactions.stake(1, validatorPublicKey),
        transactions.addKey(
          keyPair.getPublicKey(),
          transactions.functionCallAccessKey('zzz', ['www'], null),
        ),
        // transactions.deleteKey(publicKey), // dangerous action
      ],
      utils.serialize.base_decode(block.header.hash),
    );

    return signAndSendTransactions([transaction]);
  };

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

  const handleSignIn = async () => {
    setIsSigningInOrOut(true);
    try {
      // Setup keystore to locally store FunctionCall access keys.
      const keystore = new keyStores.BrowserLocalStorageKeyStore(
        window.localStorage,
        keyStorePrefix,
      );

      if (!connectedAccounts?.length) {
        throw new Error(
          'No accounts to sign in to (should connect accounts at first)',
        );
      }

      // Request FunctionCall access to the 'smartContractId' smart contract for each account.
      await signIn({
        permission: {
          receiverId: smartContractId,
          methodNames: smartContractMethods,
        },
        accounts: await Promise.all(
          connectedAccounts.map(async ({ accountId }) => {
            const keyPair = utils.KeyPair.fromRandom('ed25519');
            await keystore.setKey(network.networkId, accountId, keyPair);

            return {
              accountId,
              publicKey: keyPair.getPublicKey(),
            };
          }),
        ),
      });
    } catch (error) {
      console.error('[HandleSignIn]', error);
      const formattedErrorMessage = formatTransactionError(error);
      toast.error(formattedErrorMessage || 'Failed to sign in');
    } finally {
      setIsSigningInOrOut(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningInOrOut(true);
    try {
      // Setup keystore to retrieve locally stored FunctionCall access keys.
      const keystore = new keyStores.BrowserLocalStorageKeyStore(
        window.localStorage,
        keyStorePrefix,
      );

      // Retrieve current network and accounts with FunctionCall access keys.
      const accountIds = await keystore.getAccounts(network.networkId);

      if (!accountIds.length) {
        throw new Error('No accounts to sign out of');
      }

      // Remove FunctionCall access (previously granted via signIn) for each account.
      await signOut({
        accounts: await Promise.all(
          accountIds.map(async (accountId) => {
            const keyPair = await keystore.getKey(network.networkId, accountId);

            return {
              accountId,
              publicKey: keyPair.getPublicKey(),
            };
          }),
        ),
      });
    } catch (error) {
      console.error('[HandleSignOut]', error);
      const formattedErrorMessage = formatTransactionError(error);
      toast.error(formattedErrorMessage || 'Failed to sign out');
    } finally {
      setIsSigningInOrOut(false);
    }
  };

  const handleTestFunctionCallWithSignIn = async () => {
    setIsTestingSignIn(true);
    try {
      const { accessKey, block, provider } = await getTransactionsData();

      const transaction = transactions.createTransaction(
        connectedAccounts[0].accountId,
        connectedAccounts[0].publicKey,
        smartContractId,
        (accessKey as any).nonce + 1,
        [
          transactions.functionCall(
            smartContractMethods[0],
            smartContractFirstMethodArgs,
            utils.format.parseNearAmount('0.00000000003'),
            utils.format.parseNearAmount('0'),
          ),
        ],
        utils.serialize.base_decode(block.header.hash),
      );

      let signedTransaction = await signTransaction({
        transaction,
      });
      console.log(
        '[HandleTestFunctionCallWithSignIn] sign result:',
        signedTransactions,
      );
      setTestSignInResult(signedTransaction);

      await provider.sendTransaction(signedTransaction);
    } catch (error) {
      console.error('[HandleTestFunctionCallWithSignIn]', error);
      const formattedErrorMessage = formatTransactionError(error);
      toast.error(formattedErrorMessage || 'Failed to test sign in');
    } finally {
      setIsTestingSignIn(false);
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
        <div className="flex flex-wrap m-auto gap-4 px-[15px] py-[10px]">
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
        <div className="flex flex-wrap m-auto gap-4 px-[15px] py-[10px]">
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
                    Transaction №{index + 1}
                  </div>
                  <div className="text-blue-400">
                    Signature:{' '}
                    {JSON.stringify(signedTransaction?.signature, null, 4)}
                  </div>
                  <div className="text-fuchsia-400 mt-1">
                    Transaction:{' '}
                    {JSON.stringify(signedTransaction?.transaction, null, 4)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">No Signed Transaction</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap m-auto gap-4 px-[15px] py-[10px]">
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
            onClick={handleSignAddFunctionCallAccessKeyTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">addKey</span> Transaction{' '}
                <span className="text-yellow-400">(Function Call Access)</span>
              </>
            )}
          </button>
          <button
            onClick={handleSignAddFullAccessKeyTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-amber-500">addKey</span> Transaction{' '}
                <span className="text-yellow-400">(Full Access)</span>
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
            onClick={handleSignManyActionsTransaction}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningTransactions}
          >
            {isSigningTransactions ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              <>
                Sign <span className="text-violet-400">Many Actions</span>{' '}
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
                Sign <span className="text-lime-400">Two</span> Transactions
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
                Sign <span className="text-lime-400">Three</span> Transactions
              </>
            )}
          </button>
        </div>
      </div>

      <div className="h-0.5 bg-gray-500 w-[100%] rounded-[10px]" />
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col p-5">
          <div className="w-fit mx-auto text-2xl font-bold">Sign In/Out</div>
          <div className="w-fit mx-auto text-xl font-medium">
            (Should Clear Local Storage Before Testing Sign In/Out)
          </div>
          <div className="flex flex-col gap-4 mt-5 w-fit mx-auto">
            {testSignInResult ? (
              <div className="flex flex-col text-center">
                <div className="text-blue-400">
                  Signature:{' '}
                  {JSON.stringify(testSignInResult?.signature, null, 4)}
                </div>
                <div className="text-fuchsia-400 mt-1">
                  Transaction:{' '}
                  {JSON.stringify(testSignInResult?.transaction, null, 4)}
                </div>
              </div>
            ) : (
              <div className="text-center"></div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap m-auto gap-4 px-[15px] py-[10px]">
          <button
            onClick={handleSignIn}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningInOrOut}
          >
            {isSigningInOrOut ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Sign In'
            )}
          </button>
          <button
            onClick={handleSignOut}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningInOrOut}
          >
            {isSigningInOrOut ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Sign Out'
            )}
          </button>
          <button
            onClick={handleTestFunctionCallWithSignIn}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isSigningInOrOut}
          >
            {isTestingSignIn ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Test Function Call After Sign In'
            )}
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

export default App;
