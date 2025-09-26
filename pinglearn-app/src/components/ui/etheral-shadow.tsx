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
                <div
                    style={{
                        background: `
                            radial-gradient(ellipse 60% 50% at 15% 15%, rgba(20, 184, 166, 0.4) 0%, transparent 70%),
                            radial-gradient(ellipse 60% 50% at 25% 25%, rgba(251, 146, 60, 0.35) 0%, transparent 70%),
                            radial-gradient(ellipse 70% 60% at 50% 50%, rgba(34, 197, 94, 0.4) 0%, transparent 70%),
                            radial-gradient(ellipse 65% 55% at 80% 80%, rgba(6, 182, 212, 0.45) 0%, transparent 70%),
                            ${color}
                        `,
                        backgroundBlendMode: 'screen, overlay, multiply, multiply, normal',
                        maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
                        maskSize: sizing === "stretch" ? "100% 100%" : "cover",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        width: "100%",
                        height: "100%"
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