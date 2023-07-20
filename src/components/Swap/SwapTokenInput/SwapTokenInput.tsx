import { CrocImpact, sortBaseQuoteTokens } from '@crocswap-libs/sdk';
import {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useState,
    useCallback,
    useMemo,
    memo,
} from 'react';
import { calcImpact } from '../../../App/functions/calcImpact';
import { getFormattedNumber } from '../../../App/functions/getFormattedNumber';
import useDebounce from '../../../App/hooks/useDebounce';
import { ZERO_ADDRESS } from '../../../constants';
import { ChainDataContext } from '../../../contexts/ChainDataContext';
import { CrocEnvContext } from '../../../contexts/CrocEnvContext';
import { PoolContext } from '../../../contexts/PoolContext';
import { TradeTableContext } from '../../../contexts/TradeTableContext';
import { TradeTokenContext } from '../../../contexts/TradeTokenContext';
import truncateDecimals from '../../../utils/data/truncateDecimals';
import {
    useAppSelector,
    useAppDispatch,
} from '../../../utils/hooks/reduxToolkit';
import { linkGenMethodsIF, useLinkGen } from '../../../utils/hooks/useLinkGen';
import {
    setIsTokenAPrimary,
    setShouldSwapDirectionReverse,
    setPrimaryQuantity,
} from '../../../utils/state/tradeDataSlice';
import TokenInput from '../../Global/TokenInput/TokenInput';
import styles from '../../Global/TokenInput/TokenInput.module.css';
import TokensArrow from '../../Global/TokensArrow/TokensArrow';

interface propsIF {
    sellQtyString: { value: string; set: Dispatch<SetStateAction<string>> };
    buyQtyString: { value: string; set: Dispatch<SetStateAction<string>> };
    isSellLoading: { value: boolean; set: Dispatch<SetStateAction<boolean>> };
    isBuyLoading: { value: boolean; set: Dispatch<SetStateAction<boolean>> };
    isWithdrawFromDexChecked: boolean;
    isSaveAsDexSurplusChecked: boolean;
    slippageTolerancePercentage: number;
    setSwapAllowed: Dispatch<SetStateAction<boolean>>;
    setPriceImpact: Dispatch<SetStateAction<CrocImpact | undefined>>;
    setIsLiquidityInsufficient: Dispatch<SetStateAction<boolean>>;
    toggleDexSelection: (tokenAorB: 'A' | 'B') => void;
}

function SwapTokenInput(props: propsIF) {
    const {
        sellQtyString: { value: sellQtyString, set: setSellQtyString },
        buyQtyString: { value: buyQtyString, set: setBuyQtyString },
        isSellLoading: { value: isSellLoading, set: setIsSellLoading },
        isBuyLoading: { value: isBuyLoading, set: setIsBuyLoading },
        isWithdrawFromDexChecked,
        isSaveAsDexSurplusChecked,
        slippageTolerancePercentage,
        setSwapAllowed,
        setPriceImpact,
        setIsLiquidityInsufficient,
        toggleDexSelection,
    } = props;

    const {
        crocEnv,
        chainData: { chainId },
    } = useContext(CrocEnvContext);
    const { lastBlockNumber } = useContext(ChainDataContext);
    const { poolPriceDisplay, isPoolInitialized } = useContext(PoolContext);
    const {
        baseToken: {
            balance: baseTokenBalance,
            dexBalance: baseTokenDexBalance,
        },
        quoteToken: {
            balance: quoteTokenBalance,
            dexBalance: quoteTokenDexBalance,
        },
    } = useContext(TradeTokenContext);
    const { showSwapPulseAnimation } = useContext(TradeTableContext);

    const dispatch = useAppDispatch();
    const { isLoggedIn: isUserConnected } = useAppSelector(
        (state) => state.userData,
    );
    const { tokenA, tokenB, isTokenAPrimary, shouldSwapDirectionReverse } =
        useAppSelector((state) => state.tradeData);
    // hook to generate navigation actions with pre-loaded path
    const linkGenAny: linkGenMethodsIF = useLinkGen();

    const [lastEvent, setLastEvent] = useState<string | undefined>();
    const [disableReverseTokens, setDisableReverseTokens] = useState(false);

    const isSellTokenEth = tokenA.address === ZERO_ADDRESS;
    const isBuyTokenEth = tokenB.address === ZERO_ADDRESS;
    const sortedTokens = sortBaseQuoteTokens(tokenA.address, tokenB.address);
    const isSellTokenBase = tokenA.address === sortedTokens[0];

    const tokenABalance = isSellTokenBase
        ? baseTokenBalance
        : quoteTokenBalance;
    const tokenBBalance = isSellTokenBase
        ? quoteTokenBalance
        : baseTokenBalance;
    const tokenADexBalance = isSellTokenBase
        ? baseTokenDexBalance
        : quoteTokenDexBalance;
    const tokenBDexBalance = isSellTokenBase
        ? quoteTokenDexBalance
        : baseTokenDexBalance;

    // Let input rest 3/4 of a second before triggering an update
    const debouncedLastEvent = useDebounce(lastEvent, 750);

    useEffect(() => {
        if (isTokenAPrimary) {
            if (sellQtyString !== '') {
                setIsBuyLoading(true);
            }
        } else {
            if (buyQtyString !== '') {
                setIsSellLoading(true);
            }
        }
    }, []);

    useEffect(() => {
        // re-enable every 3 seconds
        const timerId = setInterval(() => {
            setDisableReverseTokens(false);
        }, 3000);

        // clear interval when component unmounts
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        handleBlockUpdate();
    }, [lastBlockNumber]);

    useEffect(() => {
        if (shouldSwapDirectionReverse) {
            reverseTokens();
            dispatch(setShouldSwapDirectionReverse(false));
        }
    }, [shouldSwapDirectionReverse]);

    useEffect(() => {
        if (debouncedLastEvent !== undefined) {
            isBuyLoading
                ? handleTokenAChangeEvent(debouncedLastEvent)
                : handleTokenBChangeEvent(debouncedLastEvent);
        }
    }, [debouncedLastEvent]);

    const reverseTokens = useCallback((): void => {
        if (disableReverseTokens || !isPoolInitialized) {
            return;
        } else {
            setDisableReverseTokens(true);

            isTokenAPrimary
                ? sellQtyString !== '' && parseFloat(sellQtyString) > 0
                    ? setIsSellLoading(true)
                    : null
                : buyQtyString !== '' && parseFloat(buyQtyString) > 0
                ? setIsBuyLoading(true)
                : null;

            linkGenAny.navigate({
                chain: chainId,
                tokenA: tokenB.address,
                tokenB: tokenA.address,
            });
            if (!isTokenAPrimary) {
                setSellQtyString(buyQtyString === 'NaN' ? '' : buyQtyString);
                setBuyQtyString('');
            } else {
                setBuyQtyString(sellQtyString === 'NaN' ? '' : sellQtyString);
                setSellQtyString('');
            }
            dispatch(setIsTokenAPrimary(!isTokenAPrimary));
        }
    }, [
        crocEnv,
        poolPriceDisplay,
        sellQtyString,
        buyQtyString,
        slippageTolerancePercentage,
        isTokenAPrimary,
        disableReverseTokens,
    ]);

    const handleBlockUpdate = () => {
        if (!disableReverseTokens) {
            setDisableReverseTokens(true);

            isTokenAPrimary
                ? handleTokenAChangeEvent()
                : handleTokenBChangeEvent();
        }
    };

    async function refreshImpact(
        input: string,
        sellToken: boolean,
    ): Promise<number | undefined> {
        if (isNaN(parseFloat(input)) || parseFloat(input) === 0 || !crocEnv) {
            return undefined;
        }

        const impact = await calcImpact(
            sellToken,
            crocEnv,
            tokenA.address,
            tokenB.address,
            slippageTolerancePercentage / 100,
            input,
        );
        setPriceImpact(impact);

        isTokenAPrimary ? setIsBuyLoading(false) : setIsSellLoading(false);

        if (impact) {
            setIsLiquidityInsufficient(false);
            return parseFloat(sellToken ? impact.buyQty : impact.sellQty);
        } else {
            setIsLiquidityInsufficient(true);
            setSwapAllowed(false);
            return undefined;
        }
    }

    const debouncedTokenAChangeEvent = (value: string) => {
        setBuyQtyString('');
        if (value && parseFloat(value) !== 0) {
            setIsBuyLoading(true);
            setSellQtyString(value);
            setDisableReverseTokens(true);
            setLastEvent(value);
        } else {
            setSellQtyString('');
            dispatch(setPrimaryQuantity(''));
        }
        value || setIsBuyLoading(false);
        dispatch(setIsTokenAPrimary(true));
    };

    const debouncedTokenBChangeEvent = (value: string) => {
        setSellQtyString('');
        if (value && parseFloat(value) !== 0) {
            setIsSellLoading(true);
            setBuyQtyString(value);
            setDisableReverseTokens(true);
            setLastEvent(value);
        } else {
            setBuyQtyString('');
            dispatch(setPrimaryQuantity(''));
        }
        value || setIsSellLoading(false);
        dispatch(setIsTokenAPrimary(false));
    };

    const handleTokenAChangeEvent = useMemo(
        () => async (value?: string) => {
            if (!crocEnv) return;
            let rawTokenBQty = undefined;
            if (value !== undefined) {
                const truncatedInputStr = parseTokenInput(value);
                rawTokenBQty = await refreshImpact(truncatedInputStr, true);

                setSellQtyString(truncatedInputStr);
                dispatch(setPrimaryQuantity(truncatedInputStr));
            } else {
                rawTokenBQty = await refreshImpact(sellQtyString, true);
            }

            const truncatedTokenBQty = rawTokenBQty
                ? rawTokenBQty < 2
                    ? rawTokenBQty.toPrecision(3)
                    : truncateDecimals(rawTokenBQty, 2)
                : '';

            setBuyQtyString(truncatedTokenBQty);
        },
        [
            crocEnv,
            isPoolInitialized,
            poolPriceDisplay,
            tokenA.address,
            tokenB.address,
            slippageTolerancePercentage,
            isTokenAPrimary,
            sellQtyString,
            buyQtyString,
        ],
    );

    const handleTokenBChangeEvent = useMemo(
        () => async (value?: string) => {
            if (!crocEnv) return;

            let rawTokenAQty: number | undefined;
            if (value !== undefined) {
                const truncatedInputStr = parseTokenInput(value);
                rawTokenAQty = await refreshImpact(truncatedInputStr, false);

                setBuyQtyString(truncatedInputStr);
                dispatch(setPrimaryQuantity(truncatedInputStr));
            } else {
                rawTokenAQty = await refreshImpact(buyQtyString, false);
            }

            const truncatedTokenAQty = rawTokenAQty
                ? rawTokenAQty < 2
                    ? rawTokenAQty.toPrecision(3)
                    : truncateDecimals(rawTokenAQty, 2)
                : '';
            setSellQtyString(truncatedTokenAQty);
        },
        [
            crocEnv,
            poolPriceDisplay,
            isPoolInitialized,
            tokenA.address,
            tokenB.address,
            slippageTolerancePercentage,
            isTokenAPrimary,
            sellQtyString,
            buyQtyString,
        ],
    );

    const refreshTokenData = async () => {
        if (isTokenAPrimary) {
            setIsBuyLoading(true);
            handleTokenAChangeEvent && (await handleTokenAChangeEvent());
            setIsBuyLoading(false);
        } else {
            setIsSellLoading(true);
            handleTokenBChangeEvent && (await handleTokenBChangeEvent());
            setIsSellLoading(false);
        }
    };

    const parseTokenInput = (val: string) => {
        const inputStr = val.replaceAll(',', '');
        const inputNum = parseFloat(inputStr);

        const truncatedInputStr = getFormattedNumber({
            value: inputNum,
            isToken: true,
            maxFracDigits: tokenA.decimals,
        });

        return truncatedInputStr;
    };

    return (
        <section className={`${styles.token_input_container}`}>
            <TokenInput
                fieldId='swap_sell'
                tokenAorB='A'
                token={tokenA}
                tokenInput={sellQtyString}
                tokenBalance={tokenABalance}
                tokenDexBalance={tokenADexBalance}
                isTokenEth={isSellTokenEth}
                isDexSelected={isWithdrawFromDexChecked}
                isLoading={isSellLoading}
                showPulseAnimation={showSwapPulseAnimation}
                handleTokenInputEvent={debouncedTokenAChangeEvent}
                reverseTokens={reverseTokens}
                handleToggleDexSelection={() => toggleDexSelection('A')}
                showWallet={isUserConnected}
            />
            <div
                className={`${styles.operation_container} ${
                    disableReverseTokens && styles.arrow_container_disabled
                }`}
            >
                <TokensArrow
                    disabled={disableReverseTokens}
                    onClick={reverseTokens}
                />
            </div>
            <TokenInput
                fieldId='swap_buy'
                tokenAorB='B'
                token={tokenB}
                tokenInput={buyQtyString}
                tokenBalance={tokenBBalance}
                tokenDexBalance={tokenBDexBalance}
                isTokenEth={isBuyTokenEth}
                isDexSelected={isSaveAsDexSurplusChecked}
                isLoading={isBuyLoading}
                showPulseAnimation={showSwapPulseAnimation}
                handleTokenInputEvent={debouncedTokenBChangeEvent}
                reverseTokens={reverseTokens}
                handleToggleDexSelection={() => toggleDexSelection('B')}
                showWallet={isUserConnected}
                handleRefresh={refreshTokenData}
            />
        </section>
    );
}

export default memo(SwapTokenInput);
