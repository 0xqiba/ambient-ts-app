import React, { useContext, useEffect } from 'react';
import styles from './Toolbar.module.css';
import drawLine from '../../../../assets/images/icons/draw/draw_line.svg';
import drawCross from '../../../../assets/images/icons/draw/draw_cross.svg';
import drawRect from '../../../../assets/images/icons/draw/rect.svg';
import dprange from '../../../../assets/images/icons/draw/dprange.svg';
// import drawAngle from '../../../../assets/images/icons/draw/angle_line.svg';
import horizontalRay from '../../../../assets/images/icons/draw/horizontal_ray.svg';
import fibRetracement from '../../../../assets/images/icons/draw/fibonacci_retracement.svg';
import magnet from '../../../../assets/images/icons/draw/snap.svg';
import { ChartContext } from '../../../../contexts/ChartContext';

interface ToolbarProps {
    activeDrawingType: string;
    setActiveDrawingType: React.Dispatch<React.SetStateAction<string>>;
    isToolbarOpen: boolean;
    setIsToolbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface IconList {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    label: string;
}

function Toolbar(props: ToolbarProps) {
    const {
        activeDrawingType,
        setActiveDrawingType,
        isToolbarOpen,
        setIsToolbarOpen,
    } = props;

    const { setIsMagnetActive, isMagnetActive } = useContext(ChartContext);
    const feeRate = document.getElementById('fee_rate_chart');
    const tvl = document.getElementById('tvl_chart');

    useEffect(() => {
        const column = isToolbarOpen ? 38 : 9;

        if (feeRate) {
            feeRate.style.gridTemplateColumns =
                column + 'px auto 1fr auto minmax(1em, max-content)';
        }
        if (tvl) {
            tvl.style.gridTemplateColumns =
                column + 'px auto 1fr auto minmax(1em, max-content)';
        }
    }, [isToolbarOpen, feeRate, tvl]);

    function handleDrawModeChange(item: IconList) {
        if (item.label !== 'magnet') {
            setActiveDrawingType(item.label);
        }
    }

    const drawIconList: IconList[] = [
        {
            icon: drawCross,
            label: 'Cross',
        },
        {
            icon: drawLine,
            label: 'Brush',
        },
        // {
        //     icon: drawAngle,
        //     label: 'Angle',
        // },
        {
            icon: horizontalRay,
            label: 'Ray',
        },
        {
            icon: drawRect,
            label: 'Rect',
        },
        {
            icon: fibRetracement,
            label: 'FibRetracement',
        },
        {
            icon: dprange,
            label: 'DPRange',
        },
        // Add more icons here
    ];

    const indicatorIconList: IconList[] = [
        {
            icon: magnet,
            label: 'magnet',
        },
    ];

    function handleActivateIndicator(item: IconList) {
        if (item.label === 'magnet') {
            setIsMagnetActive(!isMagnetActive);
        }
    }

    return (
        <div
            className={` ${
                isToolbarOpen ? styles.toolbar_container_active : ''
            } ${styles.toolbar_container} `}
            id='toolbar_container'
        >
            <div
                className={` ${
                    isToolbarOpen ? styles.drawlist_container_active : ''
                } ${styles.drawlist_container} `}
            >
                <div>
                    {isToolbarOpen && (
                        <>
                            {drawIconList.map((item, index) => (
                                <div key={index} className={styles.icon_card}>
                                    <div
                                        className={
                                            activeDrawingType === 'Cross'
                                                ? styles.icon_active_container
                                                : styles.icon_inactive_container
                                        }
                                        onClick={() =>
                                            handleDrawModeChange(item)
                                        }
                                    >
                                        <img
                                            className={
                                                activeDrawingType === item.label
                                                    ? styles.icon_active
                                                    : styles.icon_inactive
                                            }
                                            src={item.icon}
                                            alt=''
                                        />
                                    </div>
                                </div>
                            ))}

                            {indicatorIconList.map((item, index) => (
                                <div key={index} className={styles.icon_card}>
                                    <div
                                        onClick={() =>
                                            handleActivateIndicator(item)
                                        }
                                    >
                                        <img
                                            className={
                                                isMagnetActive
                                                    ? styles.icon_fill_container
                                                    : styles.icon_inactive_container
                                            }
                                            src={item.icon}
                                            alt=''
                                        />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <div className={styles.divider_container}>
                <div className={styles.divider}></div>
                <div
                    className={` ${
                        isToolbarOpen ? styles.divider_button : ''
                    } ${styles.close_divider_button} `}
                    onClick={() => setIsToolbarOpen((prev: boolean) => !prev)}
                >
                    <span
                        className={` ${
                            isToolbarOpen ? styles.arrow_left : ''
                        } ${styles.arrow_right} `}
                    ></span>
                </div>
            </div>
        </div>
    );
}

export default Toolbar;
