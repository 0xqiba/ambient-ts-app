import { brandIF } from './types';
import large from '../images/logos/large.svg';
import scrollLogo from '../../assets/images/logos/scroll_brand_logo.svg';
import blastLogo from '../../assets/images/logos/blast_logo.svg';

// export const defaultBrandAssets: brandAssetsIF = {
//     networks: [
//         '0x1', // ethereum mainnet
//         '0x82750', // scroll mainnet
//         '0x8274f', // scroll sepolia
//         '0xaa36a7', // ethereum sepolia
//         '0xa0c71fd', // blast sepolia
//         '0x13e31', // blast mainnet
//     ],
//     color: {
//         '0x1': 'purple_dark',
//         '0x82750': 'purple_dark',
//         '0x5': 'purple_dark',
//         '0x8274f': 'purple_dark',
//         '0xaa36a7': 'purple_dark',
//         '0xa0c71fd': 'purple_dark',
//         '0x13e31': 'purple_dark',
//     },
//     platformName: 'ambient',
//     headerImage: large as string,
//     showPoints: true,
//     showDexStats: true,
// };

export const defaultBrandAssets: brandIF = {
    networks: {
        // ethereum mainnet
        '0x1': {
            color: 'purple_dark',
            hero: [
                { content: 'ambient', processAs: 'text' },
                { content: '×', processAs: 'separator' },
                { content: blastLogo, processAs: 'image' },
            ],
        },
        // ethereum sepolia
        '0xaa36a7': {
            color: 'purple_dark',
            hero: [
                { content: 'ambient', processAs: 'text' },
                { content: '×', processAs: 'separator' },
                { content: blastLogo, processAs: 'image' },
            ],
        },
        // scroll mainnet
        '0x82750': {
            color: 'purple_dark',
            hero: [
                { content: 'ambient', processAs: 'text' },
                { content: '×', processAs: 'separator' },
                { content: scrollLogo, processAs: 'image' },
            ],
        },
        // scroll sepolia
        '0x8274f': {
            color: 'purple_dark',
            hero: [
                { content: 'ambient', processAs: 'text' },
                { content: '×', processAs: 'separator' },
                { content: scrollLogo, processAs: 'image' },
            ],
        },
        // blast mainnet
        '0x13e31': {
            color: 'purple_dark',
            hero: [
                { content: 'ambient', processAs: 'text' },
                { content: '×', processAs: 'separator' },
                { content: blastLogo, processAs: 'image' },
            ],
        },
        // blast logo
        '0xa0c71fd': {
            color: 'purple_dark',
            hero: [
                { content: 'ambient', processAs: 'text' },
                { content: '×', processAs: 'separator' },
                { content: blastLogo, processAs: 'image' },
            ],
        },
    },
    platformName: 'ambient',
    showPoints: true,
    showDexStats: true,
    headerImage: large as string,
};
