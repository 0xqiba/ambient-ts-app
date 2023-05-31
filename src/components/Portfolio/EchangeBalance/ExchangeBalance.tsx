import styles from './ExchangeBalance.module.css';

import Deposit from './Deposit/Deposit';
import Withdraw from './Withdraw/Withdraw';
import Transfer from './Transfer/Transfer';
import closeSidebarImage from '../../../assets/images/sidebarImages/closeSidebar.svg';

import transferImage from '../../../assets/images/sidebarImages/transfer.svg';
import withdrawImage from '../../../assets/images/sidebarImages/withdraw.svg';
import depositImage from '../../../assets/images/sidebarImages/deposit.svg';
import TabComponent from '../../Global/TabComponent/TabComponent';
import { motion } from 'framer-motion';
import { SetStateAction, Dispatch, useState, useEffect } from 'react';
import { TokenIF } from '../../../utils/interfaces/exports';
import { ethers } from 'ethers';
import { fetchEnsAddress } from '../../../App/functions/fetchAddress';
import IconWithTooltip from '../../Global/IconWithTooltip/IconWithTooltip';
import useMediaQuery from '../../../utils/hooks/useMediaQuery';

interface propsIF {
    mainnetProvider: ethers.providers.Provider | undefined;
    selectedToken: TokenIF;
    tokenAllowance: string;
    tokenWalletBalance: string;
    tokenDexBalance: string;
    setRecheckTokenAllowance: Dispatch<SetStateAction<boolean>>;
    fullLayoutActive: boolean;
    setFullLayoutActive: Dispatch<SetStateAction<boolean>>;
    setRecheckTokenBalances: Dispatch<SetStateAction<boolean>>;
    openTokenModal: () => void;
    selectedTokenDecimals: number;
}

export default function ExchangeBalance(props: propsIF) {
    const {
        mainnetProvider,
        selectedToken,
        tokenAllowance,
        tokenWalletBalance,
        tokenDexBalance,
        setRecheckTokenAllowance,
        setRecheckTokenBalances,
        openTokenModal,
        fullLayoutActive,
        setFullLayoutActive,
        selectedTokenDecimals,
    } = props;

    const [sendToAddress, setSendToAddress] = useState<string | undefined>();
    const [resolvedAddress, setResolvedAddress] = useState<
        string | undefined
    >();

    const isSendToAddressEns = sendToAddress?.endsWith('.eth');
    const isSendToAddressHex =
        sendToAddress?.startsWith('0x') && sendToAddress?.length == 42;

    useEffect(() => {
        (async () => {
            if (sendToAddress && isSendToAddressEns && mainnetProvider) {
                const newResolvedAddress = await mainnetProvider.resolveName(
                    sendToAddress,
                );

                if (newResolvedAddress) {
                    setResolvedAddress(newResolvedAddress);
                } else {
                    setResolvedAddress(undefined);
                }
            } else if (
                sendToAddress &&
                isSendToAddressHex &&
                !isSendToAddressEns
            ) {
                setResolvedAddress(sendToAddress);
            } else {
                setResolvedAddress(undefined);
            }
        })();
    }, [
        sendToAddress,
        isSendToAddressHex,
        isSendToAddressEns,
        mainnetProvider,
    ]);

    const [secondaryEnsName, setSecondaryEnsName] = useState<
        string | undefined
    >();

    // check for ENS name
    useEffect(() => {
        (async () => {
            if (
                sendToAddress &&
                isSendToAddressHex &&
                sendToAddress.length === 42 &&
                sendToAddress.startsWith('0x') &&
                mainnetProvider
            ) {
                try {
                    const ensName = await fetchEnsAddress(
                        mainnetProvider,
                        sendToAddress,
                        '0x1',
                    );
                    if (ensName) {
                        setSecondaryEnsName(ensName);
                    } else setSecondaryEnsName(undefined);
                } catch (error) {
                    setSecondaryEnsName(undefined);
                    console.error({ error });
                }
            } else {
                setSecondaryEnsName(undefined);
            }
        })();
    }, [sendToAddress, isSendToAddressHex]);

    const accountData = [
        {
            label: 'Deposit',
            content: (
                <Deposit
                    selectedToken={selectedToken}
                    tokenAllowance={tokenAllowance}
                    tokenWalletBalance={tokenWalletBalance}
                    tokenDexBalance={tokenDexBalance}
                    setRecheckTokenAllowance={setRecheckTokenAllowance}
                    setRecheckTokenBalances={setRecheckTokenBalances}
                    openTokenModal={openTokenModal}
                    selectedTokenDecimals={selectedTokenDecimals}
                />
            ),
            icon: depositImage,
        },
        {
            label: 'Withdraw',
            content: (
                <Withdraw
                    selectedToken={selectedToken}
                    tokenWalletBalance={tokenWalletBalance}
                    tokenDexBalance={tokenDexBalance}
                    setRecheckTokenBalances={setRecheckTokenBalances}
                    sendToAddress={sendToAddress}
                    resolvedAddress={resolvedAddress}
                    setSendToAddress={setSendToAddress}
                    secondaryEnsName={secondaryEnsName}
                    openTokenModal={openTokenModal}
                />
            ),
            icon: withdrawImage,
        },
        {
            label: 'Transfer',
            content: (
                <Transfer
                    selectedToken={selectedToken}
                    tokenDexBalance={tokenDexBalance}
                    setRecheckTokenBalances={setRecheckTokenBalances}
                    sendToAddress={sendToAddress}
                    resolvedAddress={resolvedAddress}
                    setSendToAddress={setSendToAddress}
                    secondaryEnsName={secondaryEnsName}
                    openTokenModal={openTokenModal}
                />
            ),
            icon: transferImage,
        },
    ];

    const exchangeControl = (
        <section
            className={styles.control_container}
            onClick={() => setFullLayoutActive(!fullLayoutActive)}
        >
            <IconWithTooltip title='Exchange Balance' placement='bottom'>
                <img
                    src={closeSidebarImage}
                    style={{ rotate: fullLayoutActive ? '180deg' : undefined }}
                    alt='toggleSidebar'
                    width='20px'
                />
            </IconWithTooltip>
            {/* { fullLayoutActive && <p>Exchange Balance</p>} */}
        </section>
    );

    // const titleOpacity = fullLayoutActive ? '0' : '1';

    const columnView = useMediaQuery('(max-width: 1200px)');
    return (
        <motion.main
            animate={columnView ? 'open' : fullLayoutActive ? 'closed' : 'open'}
            style={{ width: '100%' }}
            className={styles.container}
        >
            <motion.div className={styles.main_container}>
                {/* <div style={{ opacity: titleOpacity }} className={styles.title}>
                    Exchange Balance
                </div> */}
                <div className={styles.tabs_container}>
                    {(!fullLayoutActive || columnView) && (
                        <TabComponent
                            data={accountData}
                            rightTabOptions={false}
                        />
                    )}
                    {exchangeControl}
                </div>
            </motion.div>
            {(!fullLayoutActive || columnView) && (
                <section>
                    <div className={styles.info_text}>
                        Collateral deposited into the Ambient Finance exchange
                        can be traded at lower gas costs. Collateral can be
                        withdrawn at any time.
                    </div>
                </section>
            )}
        </motion.main>
    );
}
