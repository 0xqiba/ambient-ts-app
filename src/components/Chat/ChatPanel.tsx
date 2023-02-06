import styles from './ChatPanel.module.css';
import SentMessagePanel from './MessagePanel/SentMessagePanel/SentMessagePanel';
import DividerDark from '../Global/DividerDark/DividerDark';
import MessageInput from './MessagePanel/InputBox/MessageInput';
import Room from './MessagePanel/Room/Room';
import { RiArrowDownSLine } from 'react-icons/ri';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import useSocket from './Service/useSocket';
import { PoolIF } from '../../utils/interfaces/PoolIF';
import { TokenIF } from '../../utils/interfaces/TokenIF';
import { targetData } from '../../utils/state/tradeDataSlice';
import { MdOpenInFull } from 'react-icons/md';
import { useParams, useNavigate } from 'react-router-dom';
import useChatApi from './Service/ChatApi';
import { useAppSelector } from '../../utils/hooks/reduxToolkit';
import { BsChatLeftFill } from 'react-icons/bs';
import { useAccount, useEnsName } from 'wagmi';
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io';

interface currentPoolInfo {
    tokenA: TokenIF;
    tokenB: TokenIF;
    baseToken: TokenIF;
    quoteToken: TokenIF;
    didUserFlipDenom: boolean;
    isDenomBase: boolean;
    advancedMode: boolean;
    isTokenAPrimary: boolean;
    primaryQuantity: string;
    isTokenAPrimaryRange: boolean;
    primaryQuantityRange: string;
    limitTick: number;
    advancedLowTick: number;
    advancedHighTick: number;
    simpleRangeWidth: number;
    slippageTolerance: number;
    activeChartPeriod: number;
    targetData: targetData[];
}

interface ChatProps {
    chatStatus: boolean;
    onClose: () => void;
    favePools: PoolIF[];
    currentPool: currentPoolInfo;
    isFullScreen: boolean;
    setChatStatus: Dispatch<SetStateAction<boolean>>;
    fullScreen?: boolean;
    userImageData: string[];
    ensName: string;
}

export default function ChatPanel(props: ChatProps) {
    const { favePools, currentPool, setChatStatus } = props;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigate = useNavigate();
    // eslint-disable-next-line
    const messageEnd = useRef<any>(null);
    const [room, setRoom] = useState('Global');
    const { address } = useAccount();
    const { data: ens } = useEnsName({ address });
    const [currentUser, setCurrentUser] = useState<string | undefined>(undefined);
    const [name, setName] = useState('');
    const [walletID, setWalletID] = useState('');
    const [scrollDirection, setScrollDirection] = useState(String);
    const wrapperStyleFull = styles.chat_wrapper_full;
    const [notification, setNotification] = useState(0);

    const { messages, getMsg, lastMessage, messageUser } = useSocket(room);

    const { getID, updateUser, updateMessageUser } = useChatApi();
    const userData = useAppSelector((state) => state.userData);
    const isUserLoggedIn = userData.isLoggedIn;
    const resolvedAddress = userData.resolvedAddress;

    const secondaryImageData = userData.secondaryImageData || '';

    const { address: addressFromParams } = useParams();

    const connectedAccountActive =
        !addressFromParams || resolvedAddress?.toLowerCase() === address?.toLowerCase();

    // eslint-disable-next-line
    function closeOnEscapeKeyDown(e: any) {
        if ((e.charCode || e.keyCode) === 27) setChatStatus(false);
    }

    useEffect(() => {
        document.body.addEventListener('keydown', closeOnEscapeKeyDown);
        return function cleanUp() {
            document.body.removeEventListener('keydown', closeOnEscapeKeyDown);
        };
    });

    useEffect(() => {
        if (scrollDirection === 'Scroll Up') {
            if (messageUser !== currentUser) {
                if (lastMessage?.mentionedName === name || lastMessage?.mentionedName === address) {
                    setNotification((notification) => notification + 1);
                }
            } else if (messageUser === currentUser) {
                const timer = setTimeout(() => {
                    messageEnd.current?.scrollTo(
                        messageEnd.current?.scrollHeight,
                        messageEnd.current?.scrollHeight,
                    );
                }, 100);

                setNotification(0);
                return () => clearTimeout(timer);
            }
        } else {
            messageEnd.current?.scrollTo(
                messageEnd.current?.scrollHeight,
                messageEnd.current?.scrollHeight,
            );
        }
    }, [lastMessage]);

    useEffect(() => {
        setScrollDirection('Scroll Down');
        if (address) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getID().then((result: any) => {
                setCurrentUser(result.userData._id);
                setWalletID(result.userData.walletID);
                if (ens !== null) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    updateUser(currentUser as string, ens as string).then((result: any) => {
                        if (result.status === 'OK') {
                            setName(ens as string);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            updateMessageUser(currentUser as string, name).then((result: any) => {
                                return result;
                            });
                        }
                    });
                } else {
                    setName(ens !== null ? ens : result.userData.walletID);
                }
            });
        }
    }, [address, props.chatStatus, props.isFullScreen]);

    useEffect(() => {
        isCurrentUser();
    }, [isUserLoggedIn]);

    useEffect(() => {
        scrollToBottom();
        setNotification(0);

        getMsg();
    }, [room]);

    function handleCloseChatPanel() {
        props.setChatStatus(false);
    }

    const scrollToBottomButton = async () => {
        messageEnd.current?.scrollTo(
            messageEnd.current?.scrollHeight,
            messageEnd.current?.scrollHeight,
        );
    };

    const scrollToBottom = async () => {
        const timer = setTimeout(() => {
            messageEnd.current?.scrollTo(
                messageEnd.current?.scrollHeight,
                messageEnd.current?.scrollHeight,
            );
        }, 1000);
        return () => clearTimeout(timer);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleScroll = (e: any) => {
        if (e.target.scrollTop === 0 || e.target.scrollTop === 1) {
            setNotification(0);
            setScrollDirection('Scroll Down');
        } else {
            setScrollDirection('Scroll Up');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleWheel = (e: any) => {
        if (
            e.nativeEvent.wheelDelta > 0 &&
            messageEnd.current?.scrollHeight !== messageEnd.current?.scrollHeight
        ) {
            setScrollDirection('Scroll Up');
        }
    };

    const handleFullScreenRedirect = () => {
        navigate('/app/chat');
        props.setChatStatus(true);
    };

    const header = (
        <div className={styles.chat_header} onClick={() => setChatStatus(!props.chatStatus)}>
            <h2 className={styles.chat_title}>Chat</h2>
            <section>
                {props.isFullScreen || !props.chatStatus ? (
                    <></>
                ) : (
                    <MdOpenInFull
                        size={16}
                        className={styles.open_full_button}
                        onClick={handleFullScreenRedirect}
                    />
                )}
                {props.isFullScreen || !props.chatStatus ? (
                    <></>
                ) : (
                    <IoIosArrowDown
                        size={22}
                        className={styles.close_button}
                        onClick={() => handleCloseChatPanel()}
                    />
                )}
                {!props.chatStatus && <IoIosArrowUp size={22} />}
            </section>
        </div>
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isCurrentUser() {
        if (!address) {
            return setCurrentUser(undefined);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            getID().then((result: any) => {
                setCurrentUser(result.userData._id);
                setWalletID(result.userData.walletID);
                if (ens !== null) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    updateUser(currentUser as string, ens as string).then((result: any) => {
                        if (result.status === 'OK') {
                            setName(ens as string);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            updateMessageUser(currentUser as string, name).then((result: any) => {
                                return result;
                            });
                        }
                    });
                } else {
                    setName(ens === null ? result.userData.walletID : ens);
                }
            });
            return currentUser;
        }
    }

    const messageList = (
        <div
            ref={messageEnd}
            className={styles.scrollable_div}
            onScroll={handleScroll}
            onWheel={handleWheel}
            id='chatmessage'
        >
            {messages &&
                messages.map((item) => (
                    <div key={item._id} style={{ width: '90%', marginBottom: 4 }}>
                        <SentMessagePanel
                            message={item}
                            name={ens === null || ens === '' ? walletID : (ens as string)}
                            isCurrentUser={item.sender === currentUser}
                            currentUser={currentUser}
                            userImageData={
                                connectedAccountActive ? props.userImageData : secondaryImageData
                            }
                            resolvedAddress={resolvedAddress}
                            connectedAccountActive={address}
                        />
                        <hr />
                    </div>
                ))}
        </div>
    );

    const chatNotification = (
        <div className={styles.chat_notification}>
            {notification > 0 && scrollDirection === 'Scroll Up' ? (
                <div className={styles.chat_notification}>
                    <span onClick={() => scrollToBottomButton()}>
                        <BsChatLeftFill size={25} color='#7371fc' />
                        <span className={styles.text}>{notification}</span>
                    </span>
                    <RiArrowDownSLine
                        role='button'
                        size={27}
                        color='#7371fc'
                        onClick={() => scrollToBottomButton()}
                    />
                </div>
            ) : scrollDirection === 'Scroll Up' && notification <= 0 ? (
                <RiArrowDownSLine
                    size={27}
                    color='#7371fc'
                    onClick={() => scrollToBottomButton()}
                />
            ) : (
                ''
            )}
        </div>
    );

    const messageInput = (
        <MessageInput
            currentUser={currentUser as string}
            message={messages[0]}
            room={
                room === 'Current Pool'
                    ? currentPool.baseToken.symbol + currentPool.quoteToken.symbol
                    : room
            }
            ensName={ens === null || ens === '' ? walletID : (ens as string)}
        />
    );

    const contentHeight = props.isFullScreen ? '100%' : props.chatStatus ? '479px' : '40px';
    const contentWidth = props.isFullScreen ? '100%' : props.chatStatus ? '320px' : '300px';

    return (
        <div
            className={props.isFullScreen ? styles.full_screen_wrapper : styles.example}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onClick={(e: any) => e.stopPropagation()}
        >
            <div
                className={`${props.isFullScreen ? wrapperStyleFull : styles.modal_body}`}
                style={{ height: contentHeight, width: contentWidth }}
            >
                <div className={styles.chat_body}>
                    {header}

                    <Room
                        favePools={favePools}
                        selectedRoom={room}
                        setRoom={setRoom}
                        currentPool={currentPool}
                        isFullScreen={props.isFullScreen}
                        room={room}
                    />

                    <DividerDark changeColor addMarginTop addMarginBottom />

                    {messageList}

                    {chatNotification}

                    {messageInput}
                    <div id='thelastmessage' />
                </div>
            </div>
        </div>
    );
}
