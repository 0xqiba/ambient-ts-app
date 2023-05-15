import {
    useEffect,
    Dispatch,
    SetStateAction,
    useRef,
    useState,
    useContext,
    memo,
} from 'react';
import { PositionIF } from '../../../../../utils/interfaces/exports';
import { ethers } from 'ethers';
import { useProcessRange } from '../../../../../utils/hooks/useProcessRange';
import styles from '../Ranges.module.css';

import RangesMenu from '../../../../Global/Tabs/TableMenu/TableMenuComponents/RangesMenu';
import RangeDetails from '../../../../RangeDetails/RangeDetails';

import {
    useAppDispatch,
    useAppSelector,
} from '../../../../../utils/hooks/reduxToolkit';
import { setDataLoadingStatus } from '../../../../../utils/state/graphDataSlice';
import { IS_LOCAL_ENV } from '../../../../../constants';
import useOnClickOutside from '../../../../../utils/hooks/useOnClickOutside';
import { SpotPriceFn } from '../../../../../App/functions/querySpotPrice';
import useMediaQuery from '../../../../../utils/hooks/useMediaQuery';
import useCopyToClipboard from '../../../../../utils/hooks/useCopyToClipboard';
import rangeRowConstants from '../rangeRowConstants';
import { AppStateContext } from '../../../../../contexts/AppStateContext';

interface propsIF {
    provider: ethers.providers.Provider | undefined;
    baseTokenBalance: string;
    quoteTokenBalance: string;
    baseTokenDexBalance: string;
    quoteTokenDexBalance: string;
    lastBlockNumber: number;
    showPair: boolean;
    ipadView: boolean;
    showColumns: boolean;
    isShowAllEnabled: boolean;
    position: PositionIF;
    rank?: number;
    currentPositionActive: string;
    setCurrentPositionActive: Dispatch<SetStateAction<string>>;
    isOnPortfolioPage: boolean;
    isLeaderboard?: boolean;
    idx: number;
    handlePulseAnimation?: (type: string) => void;
    cachedQuerySpotPrice: SpotPriceFn;
    setSimpleRangeWidth: Dispatch<SetStateAction<number>>;
    gasPriceInGwei: number | undefined;
}

function RangesRow(props: propsIF) {
    const {
        cachedQuerySpotPrice,
        ipadView,
        showColumns,
        showPair,
        isShowAllEnabled,
        position,
        currentPositionActive,
        setCurrentPositionActive,
        isOnPortfolioPage,
        isLeaderboard,
        handlePulseAnimation,
        setSimpleRangeWidth,
        gasPriceInGwei,
    } = props;
    const {
        globalModal: { open: openGlobalModal },
        snackbar: { open: openSnackbar },
    } = useContext(AppStateContext);
    const { addressCurrent: userAddress } = useAppSelector(
        (state) => state.userData,
    );

    const {
        posHash,
        posHashTruncated,
        userNameToDisplay,
        ownerId,
        quoteTokenLogo,
        baseTokenLogo,
        userMatchesConnectedAccount,
        usdValue,
        baseTokenSymbol,
        quoteTokenSymbol,
        isOwnerActiveAccount,
        ensName,
        apyString,
        apyClassname,
        isPositionInRange,
        isPositionEmpty,
        isAmbient,
        baseTokenCharacter,
        quoteTokenCharacter,
        ambientOrMin,
        ambientOrMax,
        isDenomBase,
        minRangeDenomByMoneyness,
        maxRangeDenomByMoneyness,
        isBaseTokenMoneynessGreaterOrEqual,
        elapsedTimeString,
    } = useProcessRange(position, userAddress, isOnPortfolioPage);

    const rangeDetailsProps = {
        cachedQuerySpotPrice: cachedQuerySpotPrice,
        provider: props.provider,
        poolIdx: position.poolIdx,
        isPositionInRange: isPositionInRange,
        isAmbient: isAmbient,
        user: position.user,
        bidTick: position.bidTick,
        askTick: position.askTick,
        baseTokenSymbol: position.baseSymbol,
        baseTokenDecimals: position.baseDecimals,
        quoteTokenSymbol: position.quoteSymbol,
        quoteTokenDecimals: position.quoteDecimals,
        baseTokenBalance: props.baseTokenBalance,
        quoteTokenBalance: props.quoteTokenBalance,
        baseTokenDexBalance: props.baseTokenDexBalance,
        quoteTokenDexBalance: props.quoteTokenDexBalance,
        lowRangeDisplay: ambientOrMin,
        highRangeDisplay: ambientOrMax,
        baseTokenLogoURI: position.baseTokenLogoURI,
        quoteTokenLogoURI: position.quoteTokenLogoURI,
        isDenomBase: isDenomBase,
        baseTokenAddress: props.position.base,
        quoteTokenAddress: props.position.quote,
        lastBlockNumber: props.lastBlockNumber,
        positionApy: position.apy,
        minRangeDenomByMoneyness: minRangeDenomByMoneyness,
        maxRangeDenomByMoneyness: maxRangeDenomByMoneyness,
    };

    const rangeMenuProps = {
        rangeDetailsProps: rangeDetailsProps,
        userMatchesConnectedAccount: userMatchesConnectedAccount,
        isPositionEmpty: isPositionEmpty,
        positionData: position,
        position: position,
        baseTokenBalance: props.baseTokenBalance,
        quoteTokenBalance: props.quoteTokenBalance,
        baseTokenDexBalance: props.baseTokenDexBalance,
        quoteTokenDexBalance: props.quoteTokenDexBalance,
        isOnPortfolioPage: props.isOnPortfolioPage,
        handlePulseAnimation: handlePulseAnimation,
        isPositionInRange: isPositionInRange,
        gasPriceInGwei: gasPriceInGwei,
    };

    const openDetailsModal = () => {
        IS_LOCAL_ENV && console.debug({ position });
        openGlobalModal(
            <RangeDetails
                position={position}
                {...rangeDetailsProps}
                isBaseTokenMoneynessGreaterOrEqual={
                    isBaseTokenMoneynessGreaterOrEqual
                }
                isOnPortfolioPage={isOnPortfolioPage}
            />,
        );
    };

    const dispatch = useAppDispatch();

    const positionDomId =
        position.positionStorageSlot === currentPositionActive
            ? `position-${position.positionStorageSlot}`
            : '';

    const phoneScreen = useMediaQuery('(max-width: 500px)');

    const activePositionRef = useRef(null);

    const sideCharacter = isOnPortfolioPage
        ? isBaseTokenMoneynessGreaterOrEqual
            ? baseTokenCharacter
            : quoteTokenCharacter
        : !isDenomBase
        ? baseTokenCharacter
        : quoteTokenCharacter;

    const clickOutsideHandler = () => {
        setCurrentPositionActive('');
    };
    useOnClickOutside(activePositionRef, clickOutsideHandler);

    function scrollToDiv() {
        const element = document.getElementById(positionDomId);
        element?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest',
        });
    }
    const [_, copy] = useCopyToClipboard();

    function handleWalletCopy() {
        copy(ownerId);
        openSnackbar(`${ownerId} copied`, 'info');
    }

    function handleCopyPosHash() {
        copy(posHash.toString());
        openSnackbar(`${posHash.toString()} copied`, 'info');
    }

    useEffect(() => {
        position.positionStorageSlot === currentPositionActive
            ? scrollToDiv()
            : null;
    }, [currentPositionActive]);

    const userPositionStyle =
        userNameToDisplay === 'You' && isShowAllEnabled
            ? styles.border_left
            : null;

    const usernameStyle =
        isOwnerActiveAccount && (isShowAllEnabled || isLeaderboard)
            ? 'owned_tx_contrast'
            : ensName || userNameToDisplay === 'You'
            ? 'gradient_text'
            : 'username_base_color';

    const activePositionStyle =
        position.positionStorageSlot === currentPositionActive
            ? styles.active_position_style
            : '';

    const [highlightRow, setHighlightRow] = useState(false);
    const highlightStyle = highlightRow ? 'var(--dark2)' : '';
    const handleRowMouseDown = () => setHighlightRow(true);
    const handleRowMouseOut = () => setHighlightRow(false);

    function handleWalletLinkClick() {
        if (!isOnPortfolioPage)
            dispatch(
                setDataLoadingStatus({
                    datasetName: 'lookupUserTxData',
                    loadingStatus: isOnPortfolioPage ? false : true,
                }),
            );

        window.open(
            `/${
                isOwnerActiveAccount ? 'account' : ensName ? ensName : ownerId
            }`,
        );
    }

    // eslint-disable-next-line
    const [showHighlightedButton, setShowHighlightedButton] = useState(false);
    const handleAccountClick = () => {
        if (!isOnPortfolioPage) {
            dispatch(
                setDataLoadingStatus({
                    datasetName: 'lookupUserTxData',
                    loadingStatus: true,
                }),
            );
            const accountUrl = `/${
                isOwnerActiveAccount ? 'account' : ensName ? ensName : ownerId
            }`;
            window.open(accountUrl);
        } else {
            openDetailsModal();
        }
    };

    const rangeRowConstantsProps = {
        handleCopyPosHash,
        posHash: posHash as string,
        posHashTruncated,
        usdValue,
        openDetailsModal,
        handleRowMouseDown,
        handleRowMouseOut,
        handleWalletLinkClick,
        handleWalletCopy,
        ownerId,
        userNameToDisplay,
        isOwnerActiveAccount,
        usernameStyle,
        baseTokenLogo,
        quoteTokenLogo,
        position,
        baseTokenSymbol,
        quoteTokenSymbol,
        isLeaderboard,
        showColumns,
        rank: props.rank,
        elapsedTimeString,

        maxRangeDenomByMoneyness,
        isOnPortfolioPage,
        isAmbient,

        minRangeDenomByMoneyness,
        ambientOrMin,
        ambientOrMax,
        sideCharacter,
        ipadView,
        apyString,
        apyClassname,
        isPositionInRange,
    };

    const {
        valueWithTooltip,
        walletWithTooltip,
        tokenPair,
        idOrNull,
        rankingOrNull,
        baseQtyDisplayWithTooltip,
        quoteQtyDisplayWithTooltip,
        rangeTimeWithTooltip,
        txIdColumnComponent,
        fullScreenMinDisplay,
        fullScreenMaxDisplay,
        columnNonAmbientPrice,
        columnAmbientPrice,
        tokenValues,
        apyDisplay,
        rangeDisplay,
    } = rangeRowConstants(rangeRowConstantsProps);

    function handleRowClick() {
        if (position.positionStorageSlot === currentPositionActive) {
            return;
        }
        setCurrentPositionActive('');
        openDetailsModal();
    }

    return (
        <>
            <ul
                className={`${styles.row_container} ${activePositionStyle} ${userPositionStyle}`}
                onClick={handleRowClick}
                id={positionDomId}
                ref={currentPositionActive ? activePositionRef : null}
                style={{ backgroundColor: highlightStyle }}
            >
                {rankingOrNull}
                {showPair && rangeTimeWithTooltip}
                {isOnPortfolioPage && showPair && tokenPair}
                {idOrNull}
                {!showColumns && !isOnPortfolioPage && (
                    <li>{walletWithTooltip}</li>
                )}
                {showColumns && txIdColumnComponent}
                {!showColumns && fullScreenMinDisplay}
                {!showColumns && fullScreenMaxDisplay}
                {columnNonAmbientPrice}
                {columnAmbientPrice}
                {valueWithTooltip}
                {!showColumns && baseQtyDisplayWithTooltip}
                {!showColumns && quoteQtyDisplayWithTooltip}
                {showColumns && !phoneScreen && tokenValues}
                {apyDisplay}
                {rangeDisplay}
                <li data-label='menu' className={styles.menu}>
                    <RangesMenu
                        {...rangeMenuProps}
                        isEmpty={position.totalValueUSD === 0}
                        showHighlightedButton={showHighlightedButton}
                        setSimpleRangeWidth={setSimpleRangeWidth}
                        handleAccountClick={handleAccountClick}
                        isShowAllEnabled={isShowAllEnabled}
                    />
                </li>
            </ul>
        </>
    );
}

export default memo(RangesRow);
