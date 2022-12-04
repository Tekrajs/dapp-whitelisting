/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Web3Modal from 'web3modal';
import { providers, Contract } from 'ethers';
import { useEffect, useRef, useState } from 'react';
import { WHITELIST_CONTRACT_ADDRESS, abi } from '../constants';

export default function Home() {
    const [walletConnected, setWalletConnected] = useState(false);
    const [joinedWhitelist, setJoinedWhitelist] = useState(false);
    const [loading, setLoading] = useState(false);
    const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
    const web3ModalRef = useRef<any>();

    /**
     * Returns a Provider of Signer object representing the Etherium RPC with or without the
     * signing capabalities of the metamask attached
     *
     * A `Provider` is needed to interact with the blockchain -reading transaction, reading balances, reading state, etc.
     *
     * A `Signer` is a Special type of Provider used in case a `write` transaction needs to be made to the blockchain, which invoolves the connected account
     * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
     * request signatures from the user using Signer functions.
     *
     * @param needSigner - True if you need the Signer, default false otherwise
     */
    const getProviderOrSigner = async (needSigner = false) => {
        const provider = await web3ModalRef?.current?.connect();
        const web3Provider = new providers.Web3Provider(provider);

        // If the user is not connected to the Goerli network, let them know and throw an error
        const { chainId } = await web3Provider.getNetwork();
        if (chainId !== 5) {
            window.alert('Change the network to Goerli');
            throw new Error('Change network to Georli');
        }

        if (needSigner) {
            const signer = web3Provider.getSigner();
            return signer;
        }

        return web3Provider;
    };

    /**
     * addAddressToWhitelist: Adds the current connected address to the whitelist
     */
    const addAddressToWhitelist = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            const signer = await getProviderOrSigner(true);
            // Create a new instance of the Contract with a Signer, which allows
            // update methods
            const whitelistContract = new Contract(
                WHITELIST_CONTRACT_ADDRESS,
                abi,
                signer
            );
            // call the addAddressToWhitelist from the whitelist
            const tx = await whitelistContract.addAddressToWhitelist();
            setLoading(true);
            //wait for the transaction to get mined
            await tx.wait();
            setLoading(false);
            // get the updated number of addresses in the whitelist
            await getNumberOfWhitelisted();
            setJoinedWhitelist(true);
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * getNumberOfWhitelisted: gets the number of whitelisted addresses
     */

    const getNumberOfWhitelisted = async () => {
        try {
            // Get the provider from web3Modal, which in our case if the MetaMask
            // No need fot the Signer here, as we are only reading state from the blockchain
            const provider = await getProviderOrSigner(true);
            // We connect to the Contract using a Provider, so we will only
            // have read-only access to the contract
            const whitelistContract = new Contract(
                WHITELIST_CONTRACT_ADDRESS,
                abi,
                provider
            );
            // call the numberAddressesWhitelisted from the contract
            const _numberOfWhitelisted =
                await whitelistContract.numAddressesWhitelisted();
            setNumberOfWhitelisted(_numberOfWhitelisted);
        } catch (error) {
            console.log('Here is the error:', error);
            console.error(error);
        }
    };

    /**
     * checkIfAddressInWhitelist: Checks if the address is in the whitelist
     */
    const checkIfAddressInWhitelist = async () => {
        try {
            // We will need the Signer later to get the user's address
            // Even though it is a read transaction, since Signers are just like special kinds of Providers,
            // We can use it in it's place
            const signer = await getProviderOrSigner(true);
            const whitelistContract = new Contract(
                WHITELIST_CONTRACT_ADDRESS,
                abi,
                signer
            );
            // Get the address associated to the signer which is connected to MetaMask
            const address = await signer?.getAddress();
            console.log("Address", address);
            // call the whitelistedAddresses from the contract
            const _joinedWhitelist =
                await whitelistContract.whitelistedAddresses(address);
                console.log('_joinedWhitelist', _joinedWhitelist)
            setJoinedWhitelist(_joinedWhitelist);
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * connectWallet: Connects the MetaMask wallet
     */
    const connectWallet = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // When used for the first time, it prompts the user to connect their wallet
            await getProviderOrSigner();
            setWalletConnected(true);

            checkIfAddressInWhitelist();
            getNumberOfWhitelisted();
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * renderButton: Returns a button on the state of the dapp
     */
    const renderButton = () => {
        if (walletConnected) {
            if (joinedWhitelist) {
                return (
                    <div className={styles.description}>
                        Thanks for joining the Whitelist!
                    </div>
                );
            } else if (loading) {
                return <button className={styles.button}> Loading...</button>;
            } else {
                return (
                    <button
                        onClick={addAddressToWhitelist}
                        className={styles.button}
                    >
                        Join the Whitelist
                    </button>
                );
            }
        } else {
            return (
                <button onClick={connectWallet} className={styles.button}>
                    Connect your wallet
                </button>
            );
        }
    };

    useEffect(() => {
        if (!walletConnected) {
            web3ModalRef.current = new Web3Modal({
                network: 'goerli',
                providerOptions: {},
                disableInjectedProvider: false,
            });
            connectWallet();
        }
    }, [walletConnected]);

    return (
        <div>
            <Head>
                <title>Whitelist Dapp</title>
                <meta name="description" content="Whitelist-Dapp" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>
                        Welcome to Virtual Gravity!
                    </h1>
                    <div className={styles.description}>
                        Its an NFT collection for developers in Virtual Gravity
                    </div>
                    <div className={styles.description}>
                        {numberOfWhitelisted} have already joined the whitelist
                    </div>
                    {renderButton()}
                </div>

                <div>
                    <img
                        className={styles.image}
                        src="./crypto-devs.svg"
                        alt=""
                    />
                </div>
            </div>

            <footer className={styles.footer}>
                Made with &#10084; by &nbsp;
                <a href="https://www.virtual-gravity.com"> Virtual Gravity</a>
            </footer>
        </div>
    );
}
