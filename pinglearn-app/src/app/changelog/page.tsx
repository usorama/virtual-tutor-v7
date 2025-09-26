'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Users, Package, Zap } from 'lucide-react';
import { Timeline } from '@/components/ui/timeline';
import { Component as EtheralShadow } from '@/components/ui/etheral-shadow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import changelogData from '@/data/changelog.json';

export default function ChangelogPage() {

  // Transform changelog entries for timeline component
  const timelineData = changelogData.entries.map((entry) => ({
    title: `v${entry.version}`,
    content: (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              variant={(entry.type as string) === 'major' ? 'default' : (entry.type as string) === 'minor' ? 'secondary' : 'outline'}
              className="text-sm px-3 py-1"
            >
              {entry.type.toUpperCase()} RELEASE
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{new Date(entry.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white">{entry.title}</h3>
          <p className="text-lg text-white/70">{entry.description}</p>
        </div>

        {/* Features Section */}
        {entry.features && entry.features.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-green-500" />
              New Features
            </h4>
            <ul className="space-y-2">
              {entry.features.map((feature, idx) => (
                <li key={idx} className="text-sm text-white/60 pl-4">
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements Section */}
        {entry.improvements && entry.improvements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-white">
              <Package className="h-5 w-5 text-blue-500" />
              Improvements
            </h4>
            <ul className="space-y-2">
              {entry.improvements.map((improvement, idx) => (
                <li key={idx} className="text-sm text-white/60 pl-4">
                  • {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Stack */}
        {entry.technical && entry.technical.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-purple-500" />
              Technical Stack
            </h4>
            <ul className="space-y-2">
              {entry.technical.map((tech, idx) => (
                <li key={idx} className="text-sm text-white/60 pl-4">
                  • {tech}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contributors */}
        {entry.contributors && entry.contributors.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold flex items-center gap-2 text-white">
              <Users className="h-5 w-5 text-orange-500" />
              Contributors
            </h4>
            <div className="flex flex-wrap gap-2">
              {entry.contributors.map((contributor, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {contributor}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }));

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ethereal Shadow Background */}
      <EtheralShadow
        color="rgba(60, 60, 70, 0.7)"
        animation={{ scale: 50, speed: 80 }}
        noise={{ opacity: 30, scale: 0.5 }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <div className="container mx-auto px-4 py-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2 text-white hover:text-white/80">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-20">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                PingLearn Changelog
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Track the evolution of PingLearn as we continuously improve the AI-powered mathematics learning experience.
              </p>

              {/* Current Version Badge */}
              <div className="mt-6">
                <Badge variant="default" className="text-lg px-4 py-2 bg-cyan-500/20 border-cyan-500/50 text-cyan-200">
                  Current Version: {changelogData.metadata.currentVersion}
                </Badge>
              </div>
            </div>

            {/* Timeline Component */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8">
              <Timeline data={timelineData} />
            </div>

            {/* Footer Stats */}
            <div className="mt-20 text-center space-y-4">
              <div className="flex justify-center gap-8 text-sm text-white/60">
                <div>
                  <span className="font-semibold text-white">{changelogData.metadata.totalReleases}</span>
                  {' '}Total Release{changelogData.metadata.totalReleases !== 1 ? 's' : ''}
                </div>
                <div>
                  Last Updated:{' '}
                  <span className="font-semibold text-white">
                    {new Date(changelogData.metadata.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}