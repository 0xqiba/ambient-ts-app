import { CrocEnv, concDepositSkew } from '@crocswap-libs/sdk';
import { ethers } from 'ethers';
import { createRangePositionTx } from '../../../dataLayer/transactions/range';
import { goerliETH, goerliUSDC } from '../../../constants';
import {
    querySpotPrice,
    calculateSecondaryDepositQty,
    getPinnedPriceValuesFromTicks,
    roundDownTick,
    roundUpTick,
} from '../../../dataLayer';
import { fetchBlockNumber } from '../../../api';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import { isNetworkAccessDisabled } from '../../config';

describe('submit a ETH/USDC liquidity position on Goerli', () => {
    const ETH_USDC_GOERLI_POOL_PRICE = 22698072.797389716;
    const TOKEN_B_QTY = 450;
    const DEFAULT_MIN_PRICE_DIFF_PERCENTAGE = -10;
    const DEFAULT_MAX_PRICE_DIFF_PERCENTAGE = 10;
    const TEST_TIMEOUT = 60_000;

    const providerUrl =
        process.env.GOERLI_PROVIDER_URL ||
        'https://goerli.infura.io/v3/c2d502344b024adf84b313c663131ada';
    const walletPrivateKey =
        process.env.GOERLI_PRIVATE_KEY ||
        'f95fc54b0f7c16b5b81998b084c1d17e27b0252c6578cebcfdf02cd1ba50221a';

    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const signer = new ethers.Wallet(walletPrivateKey, provider);

    const crocEnv = new CrocEnv(provider, signer);
    console.log(`Successfully initialized crocEnv: ${JSON.stringify(crocEnv)}`);

    const chainId = '0x5';

    const tokenA = goerliETH;
    const tokenB = goerliUSDC;

    const tokenAQty = 0.01;
    console.log(`Setting Token A Quantity to: ${tokenAQty}`);

    let tick: { low: number; high: number };
    let lastBlockNumber: number;
    let poolPriceNonDisplay: number;
    let tokenBQty: number;

    // NOTE: ticks are purely in geometric space, non-display space -- not formatted, but for humans, display space -- for humans and formatted decimals
    // NOTE: contract uses geometric space, non-display space is used by SDK, diplsay space is for humans
    // NOTE: when sdk returns a value, its always denominated in quote

    beforeAll(async () => {
        lastBlockNumber = await fetchBlockNumber(providerUrl);
        console.log(`Fetched lastBlockNumber: ${lastBlockNumber}`);

        // TOOD: this is in arithmetic space
        poolPriceNonDisplay =
            (await querySpotPrice(
                crocEnv,
                tokenA.address,
                tokenB.address,
                chainId,
                lastBlockNumber,
            )) || ETH_USDC_GOERLI_POOL_PRICE;
        console.log(`Queried poolPriceNonDisplay: ${poolPriceNonDisplay}`);

        const gridSize = lookupChain(chainId).gridSize;
        console.log(`using gridSize: ${gridSize}`);

        const pool = crocEnv.pool(tokenA.address, tokenB.address);
        const currentPoolPriceTick = await pool.spotTick();

        // const currentPoolPriceTick = Math.log(poolPriceNonDisplay) / Math.log(1.0001);

        const defaultLowTick = roundDownTick(
            currentPoolPriceTick + DEFAULT_MIN_PRICE_DIFF_PERCENTAGE * 100,
            gridSize,
        );
        const defaultHighTick = roundUpTick(
            currentPoolPriceTick + DEFAULT_MAX_PRICE_DIFF_PERCENTAGE * 100,
            gridSize,
        );

        tick = {
            low: defaultLowTick,
            high: defaultHighTick,
        };
        console.log(`Calculated low tick: ${tick.low}`);
        console.log(`Calculated high tick: ${tick.high}`);

        const { pinnedMinPriceNonDisplay, pinnedMaxPriceNonDisplay } =
            getPinnedPriceValuesFromTicks(
                true,
                tokenA.decimals,
                tokenB.decimals,
                tick.low,
                tick.high,
                gridSize,
            );
        console.log(
            `Calculated pinnedMinPriceNonDisplay: ${pinnedMinPriceNonDisplay}`,
        );
        console.log(
            `Calculated pinnedMaxPriceNonDisplay: ${pinnedMaxPriceNonDisplay}`,
        );

        const depositSkew = concDepositSkew(
            poolPriceNonDisplay,
            pinnedMinPriceNonDisplay,
            pinnedMaxPriceNonDisplay,
        );
        console.log(`using deposit skew: ${depositSkew}`);

        tokenBQty =
            calculateSecondaryDepositQty(
                poolPriceNonDisplay,
                tokenA.decimals,
                tokenB.decimals,
                tokenAQty.toString(),
                true,
                true,
                false,
                depositSkew,
            ) || TOKEN_B_QTY;
        console.log(`Calculating Token B Quantity to be: ${tokenBQty}`);
    }, TEST_TIMEOUT);

    if (isNetworkAccessDisabled()) {
        it.skip('skipping all range tests -- network access disabled', () => {});
    } else {
        it(
            'createRangePosition()',
            async () => {
                const initialEthBalance = await signer.provider.getBalance(
                    signer.address,
                );

                console.log(
                    'Initial ETH balance:',
                    ethers.utils.formatEther(initialEthBalance),
                );

                const params = {
                    crocEnv,
                    isAmbient: false,
                    slippageTolerancePercentage: 5,
                    isTokenAPrimaryRange: true,
                    tokenA: {
                        address: tokenA.address,
                        qty: tokenAQty,
                        isWithdrawFromDexChecked: false,
                    },
                    tokenB: {
                        address: tokenB.address,
                        qty: tokenBQty,
                        isWithdrawFromDexChecked: false,
                    },
                    tick,
                };

                const tx = await createRangePositionTx(params);
                expect(tx).toBeDefined();
                expect(tx.hash).toBeDefined();

                const receipt = await tx.wait();
                expect(receipt.status).toEqual(1);

                const finalEthBalance = await signer.provider.getBalance(
                    signer.address,
                );
                console.log(
                    'Final ETH balance:',
                    ethers.utils.formatEther(finalEthBalance),
                );

                expect(finalEthBalance.lt(initialEthBalance)).toBe(true);
                // TODO: add another assertion for a minimum decrease in balance i.e. 0.01 ETH
            },
            TEST_TIMEOUT,
        );
    }
});
