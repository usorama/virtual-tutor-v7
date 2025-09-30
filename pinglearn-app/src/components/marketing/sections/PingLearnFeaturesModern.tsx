"use client";

import { Card, CardContent } from '@/components/ui/card'
import { Shield, Users, Brain, Zap, Clock, Heart, Trophy, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'

export function PingLearnFeaturesModern() {
    return (
        <section className="bg-gradient-to-b from-gray-900 to-black py-16 md:py-32" id="problem-solution">
            <div className="mx-auto max-w-3xl lg:max-w-5xl px-6">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <p className="text-cyan-400/60 text-sm tracking-[0.3em] uppercase font-medium mb-4">
                        Complete Learning Solution
                    </p>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                        PingLearn Solves
                        <span className="text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"> Everything</span>
                    </h2>
                    <p className="text-xl text-white/70 max-w-3xl mx-auto">
                        One platform that addresses every challenge in your child&apos;s educational journey
                        with innovative technology and empathetic teaching.
                    </p>
                </motion.div>

                <div className="relative">
                    <div className="relative z-10 grid grid-cols-6 gap-3">
                        {/* 100% Adaptive - Large Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="col-span-full lg:col-span-2"
                        >
                            <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                                <CardContent className="relative m-auto size-fit pt-6">
                                    <div className="relative flex h-24 w-56 items-center">
                                        <svg className="absolute inset-0 size-full text-cyan-400/30" viewBox="0 0 254 104" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                d="M112.891 97.7022C140.366 97.0802 171.004 94.6715 201.087 87.5116C210.43 85.2881 219.615 82.6412 228.284 78.2473C232.198 76.3179 235.905 73.9942 239.348 71.3124C241.85 69.2557 243.954 66.7571 245.555 63.9408C249.34 57.3235 248.281 50.5341 242.498 45.6109C239.033 42.7237 235.228 40.2703 231.169 38.3054C219.443 32.7209 207.141 28.4382 194.482 25.534C184.013 23.1927 173.358 21.7755 162.64 21.2989C161.376 21.3512 160.113 21.181 158.908 20.796C158.034 20.399 156.857 19.1682 156.962 18.4535C157.115 17.8927 157.381 17.3689 157.743 16.9139C158.104 16.4588 158.555 16.0821 159.067 15.8066C160.14 15.4683 161.274 15.3733 162.389 15.5286C179.805 15.3566 196.626 18.8373 212.998 24.462C220.978 27.2494 228.798 30.4747 236.423 34.1232C240.476 36.1159 244.202 38.7131 247.474 41.8258C254.342 48.2578 255.745 56.9397 251.841 65.4892C249.793 69.8582 246.736 73.6777 242.921 76.6327C236.224 82.0192 228.522 85.4602 220.502 88.2924C205.017 93.7847 188.964 96.9081 172.738 99.2109C153.442 101.949 133.993 103.478 114.506 103.79C91.1468 104.161 67.9334 102.97 45.1169 97.5831C36.0094 95.5616 27.2626 92.1655 19.1771 87.5116C13.839 84.5746 9.1557 80.5802 5.41318 75.7725C-0.54238 67.7259 -1.13794 59.1763 3.25594 50.2827C5.82447 45.3918 9.29572 41.0315 13.4863 37.4319C24.2989 27.5721 37.0438 20.9681 50.5431 15.7272C68.1451 8.8849 86.4883 5.1395 105.175 2.83669C129.045 0.0992292 153.151 0.134761 177.013 2.94256C197.672 5.23215 218.04 9.01724 237.588 16.3889C240.089 17.3418 242.498 18.5197 244.933 19.6446C246.627 20.4387 247.725 21.6695 246.997 23.615C246.455 25.1105 244.814 25.5605 242.63 24.5811C230.322 18.9961 217.233 16.1904 204.117 13.4376C188.761 10.3438 173.2 8.36665 157.558 7.52174C129.914 5.70776 102.154 8.06792 75.2124 14.5228C60.6177 17.8788 46.5758 23.2977 33.5102 30.6161C26.6595 34.3329 20.4123 39.0673 14.9818 44.658C12.9433 46.8071 11.1336 49.1622 9.58207 51.6855C4.87056 59.5336 5.61172 67.2494 11.9246 73.7608C15.2064 77.0494 18.8775 79.925 22.8564 82.3236C31.6176 87.7101 41.3848 90.5291 51.3902 92.5804C70.6068 96.5773 90.0219 97.7419 112.891 97.7022Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="mx-auto block w-fit text-5xl font-semibold text-white">100%</span>
                                    </div>
                                    <h2 className="mt-6 text-center text-3xl font-semibold text-white">Adaptive</h2>
                                    <p className="text-center text-white/60 mt-2">PingLearn adapts to each student&apos;s unique learning style and pace in real-time</p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Security Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            viewport={{ once: true }}
                            className="col-span-full sm:col-span-3 lg:col-span-2"
                        >
                            <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                                <CardContent className="pt-6">
                                    <div className="relative mx-auto flex aspect-square size-32 rounded-full border border-cyan-500/20 before:absolute before:-inset-2 before:rounded-full before:border before:border-cyan-500/10">
                                        <Shield className="m-auto size-16 text-cyan-400" strokeWidth={1} />
                                    </div>
                                    <div className="relative z-10 mt-6 space-y-2 text-center">
                                        <h2 className="text-lg font-medium text-white">Secure by Default</h2>
                                        <p className="text-white/60 text-sm">COPPA compliant with enterprise-grade security. Your child&apos;s data and privacy are our top priority.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Speed Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            viewport={{ once: true }}
                            className="col-span-full sm:col-span-3 lg:col-span-2"
                        >
                            <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                                <CardContent className="pt-6">
                                    <div className="pt-6 lg:px-6">
                                        <div className="flex items-center justify-center h-24">
                                            <div className="flex items-center space-x-2">
                                                <Zap className="w-12 h-12 text-cyan-400" />
                                                <span className="text-4xl font-bold text-white">400ms</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 mt-6 space-y-2 text-center">
                                        <h2 className="text-lg font-medium text-white">Lightning Fast</h2>
                                        <p className="text-white/60 text-sm">400ms response time with instant math rendering. No waiting, no lag, just seamless learning.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Always Available Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="col-span-full lg:col-span-3"
                        >
                            <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                                <CardContent className="grid pt-6 sm:grid-cols-2">
                                    <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                        <div className="relative flex aspect-square size-12 rounded-full border border-cyan-500/20 before:absolute before:-inset-2 before:rounded-full before:border before:border-cyan-500/10">
                                            <Clock className="m-auto size-5 text-cyan-400" strokeWidth={1} />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-lg font-medium text-white">Always Available</h2>
                                            <p className="text-white/60 text-sm">Learn at 3 PM or 3 AM. PingLearn is ready whenever your child is inspired to learn.</p>
                                        </div>
                                    </div>
                                    <div className="rounded-tl-lg relative -mb-6 -mr-6 mt-6 h-fit border-l border-t border-cyan-500/20 p-6 py-6 sm:ml-6">
                                        <div className="absolute left-3 top-2 flex gap-1">
                                            <span className="block size-2 rounded-full bg-cyan-400/40"></span>
                                            <span className="block size-2 rounded-full bg-cyan-400/40"></span>
                                            <span className="block size-2 rounded-full bg-cyan-400/40"></span>
                                        </div>
                                        <div className="flex flex-col space-y-4 mt-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                                    <span className="text-cyan-400 text-xs font-bold">24</span>
                                                </div>
                                                <span className="text-white/80 text-sm">Hours Available</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                                    <span className="text-cyan-400 text-xs font-bold">7</span>
                                                </div>
                                                <span className="text-white/80 text-sm">Days a Week</span>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                                    <span className="text-cyan-400 text-xs font-bold">∞</span>
                                                </div>
                                                <span className="text-white/80 text-sm">Patience Level</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Results Feature */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            viewport={{ once: true }}
                            className="col-span-full lg:col-span-3"
                        >
                            <Card className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 transition-all duration-300">
                                <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                                    <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                        <div className="relative flex aspect-square size-12 rounded-full border border-cyan-500/20 before:absolute before:-inset-2 before:rounded-full before:border before:border-cyan-500/10">
                                            <Trophy className="m-auto size-6 text-cyan-400" strokeWidth={1} />
                                        </div>
                                        <div className="space-y-2">
                                            <h2 className="text-lg font-medium text-white">Proven Results</h2>
                                            <p className="text-white/60 text-sm">92% grade improvement average. Students gain confidence and excel beyond expectations.</p>
                                        </div>
                                    </div>
                                    <div className="relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px before:bg-cyan-500/20 sm:-my-6 sm:-mr-6">
                                        <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                                            <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                                <span className="block h-fit rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400 shadow-sm">A+ Student</span>
                                                <div className="size-7 ring-4 ring-cyan-500/20">
                                                    <div className="size-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                                                        <Heart className="w-3 h-3 text-white" fill="white" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative ml-[calc(50%-1rem)] flex items-center gap-2">
                                                <div className="size-8 ring-4 ring-cyan-500/20">
                                                    <div className="size-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center">
                                                        <BookOpen className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                                <span className="block h-fit rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400 shadow-sm">Math Expert</span>
                                            </div>
                                            <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                                <span className="block h-fit rounded border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400 shadow-sm">Confident</span>
                                                <div className="size-7 ring-4 ring-cyan-500/20">
                                                    <div className="size-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                                                        <Brain className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-6 py-3">
                        <Zap className="w-5 h-5 text-cyan-400" />
                        <span className="text-cyan-400 font-medium">
                            Join 50,000+ students already excelling with PingLearn
                        </span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}