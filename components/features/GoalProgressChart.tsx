'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ClientGoal } from '@/types';

interface GoalProgressChartProps {
  goals: ClientGoal[];
}

export const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ goals }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || goals.length === 0) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const now = new Date();
    const dataByGoal = goals.map(goal => {
      let points = goal.gasHistory?.map(h => ({
        date: new Date(h.date),
        progress: Math.max(0, Math.min(100, 50 + (h.score * 25)))
      })) || [];

      if (points.length === 0) {
        let currentProgress = goal.progressPercent || 0;
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now);
          d.setMonth(d.getMonth() - i);
          const p = Math.max(0, currentProgress - (i * (currentProgress / 5)));
          points.push({ date: d, progress: p });
        }
      }
      return { id: goal.id, title: goal.title, points };
    });

    const allPoints = dataByGoal.flatMap(d => d.points);
    if (allPoints.length === 0) return;
    
    const x = d3.scaleTime()
      .domain(d3.extent(allPoints, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %Y') as any))
      .attr('color', '#64748b')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    // Y Axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', '#64748b')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    // Grid lines
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => ''))
      .attr('color', '#1e293b')
      .attr('stroke-dasharray', '2,2')
      .style('opacity', 0.5);

    const colors = ['#2dd4bf', '#fbbf24', '#f87171', '#818cf8', '#c084fc', '#34d399'];
    const colorScale = d3.scaleOrdinal(colors);

    const line = d3.line<{ date: Date; progress: number }>()
      .x(d => x(d.date))
      .y(d => y(d.progress))
      .curve(d3.curveMonotoneX);

    dataByGoal.forEach((series, i) => {
      const color = colorScale(i.toString());
      
      svg.append('path')
        .datum(series.points)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('d', line);
        
      svg.selectAll(`.dot-${series.id}`)
        .data(series.points)
        .enter()
        .append('circle')
        .attr('class', `dot-${series.id}`)
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.progress))
        .attr('r', 4)
        .attr('fill', color)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 2);
        
      // Legend Item
      const legendX = 10;
      const legendY = 10 + i * 16;
      
      svg.append('rect')
        .attr('x', legendX)
        .attr('y', legendY - 6)
        .attr('width', 8)
        .attr('height', 8)
        .attr('fill', color)
        .attr('rx', 2);
        
      svg.append('text')
        .attr('x', legendX + 14)
        .attr('y', legendY + 2)
        .text(series.title.length > 25 ? series.title.substring(0, 25) + '...' : series.title)
        .style('fill', '#94a3b8')
        .style('font-size', '10px')
        .style('font-family', 'sans-serif')
        .style('font-weight', '600');
    });

  }, [goals]);

  if (!goals || goals.length === 0) {
    return (
      <div className="p-8 text-xs text-slate-500 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 font-medium">
        No goals actively tracked for this participant yet.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <h4 className="text-xs font-bold text-slate-300 mb-2 font-sans flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
        Goal Achievement Timeline (6-Month Projection)
      </h4>
      <div ref={chartRef} className="w-full h-[300px] overflow-hidden" />
    </div>
  );
};
