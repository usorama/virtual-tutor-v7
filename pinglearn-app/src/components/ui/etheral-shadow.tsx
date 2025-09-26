'use client';

import React, { useRef, useId, useEffect, CSSProperties } from 'react';
import { animate, useMotionValue, AnimationPlaybackControls } from 'framer-motion';

// Type definitions
interface ResponsiveImage {
    src: string;
    alt?: string;
    srcSet?: string;
}

interface AnimationConfig {
    preview?: boolean;
    scale: number;
    speed: number;
}

interface NoiseConfig {
    opacity: number;
    scale: number;
}

interface ShadowOverlayProps {
    type?: 'preset' | 'custom';
    presetIndex?: number;
    customImage?: ResponsiveImage;
    sizing?: 'fill' | 'stretch';
    color?: string;
    animation?: AnimationConfig;
    noise?: NoiseConfig;
    style?: CSSProperties;
    className?: string;
}

function mapRange(
    value: number,
    fromLow: number,
    fromHigh: number,
    toLow: number,
    toHigh: number
): number {
    if (fromLow === fromHigh) {
        return toLow;
    }
    const percentage = (value - fromLow) / (fromHigh - fromLow);
    return toLow + percentage * (toHigh - toLow);
}

const useInstanceId = (): string => {
    const id = useId();
    const cleanId = id.replace(/:/g, "");
    const instanceId = `shadowoverlay-${cleanId}`;
    return instanceId;
};

export function Component({
    sizing = 'fill',
    color = 'rgba(128, 128, 128, 1)',
    animation,
    noise,
    style,
    className
}: ShadowOverlayProps) {
    const id = useInstanceId();
    const animationEnabled = animation && animation.scale > 0;
    const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
    const feTurbulenceRef = useRef<SVGFETurbulenceElement>(null);
    const hueRotateMotionValue = useMotionValue(180);
    const turbulenceMotionValue = useMotionValue(0.001);
    const hueRotateAnimation = useRef<AnimationPlaybackControls | null>(null);
    const turbulenceAnimation = useRef<AnimationPlaybackControls | null>(null);

    const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
    const animationDuration = animation ? mapRange(animation.speed, 1, 100, 5, 1) : 1;

    useEffect(() => {
        if (animationEnabled && feTurbulenceRef.current) {
            // Stop existing animations
            if (hueRotateAnimation.current) {
                hueRotateAnimation.current.stop();
            }
            if (turbulenceAnimation.current) {
                turbulenceAnimation.current.stop();
            }

            // Animate hue rotation for color changes (ultra slow)
            hueRotateMotionValue.set(0);
            hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
                duration: animationDuration * 80, // Half speed again (144 seconds)
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                onUpdate: (value: number) => {
                    if (feColorMatrixRef.current) {
                        feColorMatrixRef.current.setAttribute("values", String(value));
                    }
                }
            });

            // Animate turbulence for shadow movement (ultra slow)
            turbulenceMotionValue.set(0.001);
            turbulenceAnimation.current = animate(turbulenceMotionValue, [0.001, 0.008, 0.001], {
                duration: animationDuration * 40, // Half speed again (72 seconds)
                repeat: Infinity,
                ease: "easeInOut",
                onUpdate: (value: number) => {
                    if (feTurbulenceRef.current) {
                        const baseFreqX = value;
                        const baseFreqY = value * 1.5;
                        feTurbulenceRef.current.setAttribute("baseFrequency", `${baseFreqX} ${baseFreqY}`);
                    }
                }
            });

            return () => {
                if (hueRotateAnimation.current) {
                    hueRotateAnimation.current.stop();
                }
                if (turbulenceAnimation.current) {
                    turbulenceAnimation.current.stop();
                }
            };
        }
    }, [animationEnabled, animationDuration, hueRotateMotionValue, turbulenceMotionValue]);

    return (
        <div
            className={className}
            style={{
                overflow: "hidden",
                position: "relative",
                width: "100%",
                height: "100%",
                ...style
            }}
        >
            <div
                style={{
                    position: "absolute",
                    inset: -displacementScale,
                    filter: animationEnabled ? `url(#${id}) blur(4px)` : "none"
                }}
            >
                {animationEnabled && (
                    <svg style={{ position: "absolute" }}>
                        <defs>
                            <filter id={id}>
                                <feTurbulence
                                    ref={feTurbulenceRef}
                                    result="undulation"
                                    numOctaves="2"
                                    baseFrequency="0.001 0.0015"
                                    seed="0"
                                    type="turbulence"
                                />
                                <feColorMatrix
                                    ref={feColorMatrixRef}
                                    in="undulation"
                                    type="hueRotate"
                                    values="180"
                                />
                                <feColorMatrix
                                    in="undulation"
                                    result="circulation"
                                    type="matrix"
                                    values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                                />
                                <feDisplacementMap
                                    in="SourceGraphic"
                                    in2="circulation"
                                    scale={displacementScale}
                                    result="dist"
                                />
                                <feDisplacementMap
                                    in="dist"
                                    in2="undulation"
                                    scale={displacementScale}
                                    result="output"
                                />
                            </filter>
                        </defs>
                    </svg>
                )}
                {/* Original shadow layer - 40% coverage */}
                <div
                    style={{
                        backgroundColor: color,
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "100% 100%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        width: "100%",
                        height: "100%",
                        opacity: 0.8
                    }}
                />

                {/* Colorful gradient shadows - 60% coverage - Using Transform Positioning */}

                {/* Main Cyan shadow - Bottom area (working position) */}
                <div
                    style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.8)',
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "120% 120%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center", // Keep mask where it works
                        width: "100%",
                        height: "100%",
                        opacity: 1,
                        transform: 'scale(1.1) rotate(15deg) translateY(20%)', // Move visually to bottom
                        transformOrigin: 'center'
                    }}
                />

                {/* Bright Yellow shadow - Top area */}
                <div
                    style={{
                        backgroundColor: 'rgba(251, 191, 36, 0.8)',
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "130% 130%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center", // Keep mask where it works
                        width: "100%",
                        height: "100%",
                        opacity: 0.9,
                        transform: 'scale(1.2) rotate(25deg) translateY(-40%)', // Move visually to top
                        transformOrigin: 'center'
                    }}
                />

                {/* Pastel Green shadow - Middle left */}
                <div
                    style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.7)',
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "110% 110%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center", // Keep mask where it works
                        width: "100%",
                        height: "100%",
                        opacity: 0.8,
                        transform: 'scale(0.95) rotate(-10deg) translateX(-30%) translateY(-10%)', // Move to middle-left
                        transformOrigin: 'center'
                    }}
                />

                {/* Additional Cyan - Top right */}
                <div
                    style={{
                        backgroundColor: 'rgba(6, 182, 212, 0.6)',
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "100% 100%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center", // Keep mask where it works
                        width: "100%",
                        height: "100%",
                        opacity: 0.7,
                        transform: 'scale(0.9) rotate(-20deg) translateX(40%) translateY(-30%)', // Move to top-right
                        transformOrigin: 'center'
                    }}
                />

                {/* Additional Green - Middle right */}
                <div
                    style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.5)',
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "90% 90%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center", // Keep mask where it works
                        width: "100%",
                        height: "100%",
                        opacity: 0.6,
                        transform: 'scale(1.15) rotate(35deg) translateX(50%) translateY(10%)', // Move to middle-right
                        transformOrigin: 'center'
                    }}
                />

                {/* Amber/Orange shadow - Bottom left */}
                <div
                    style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.6)',
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "105% 105%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center", // Keep mask where it works
                        width: "100%",
                        height: "100%",
                        opacity: 0.7,
                        transform: 'scale(0.85) rotate(-30deg) translateX(-40%) translateY(30%)', // Move to bottom-left
                        transformOrigin: 'center'
                    }}
                />
            </div>

            {/* Text overlay removed for background-only usage */}

            {noise && noise.opacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
                        backgroundSize: noise.scale * 200,
                        backgroundRepeat: "repeat",
                        opacity: noise.opacity / 2
                    }}
                />
            )}
        </div>
    );
}