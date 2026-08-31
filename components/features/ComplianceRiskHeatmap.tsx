import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const ComplianceRiskHeatmap: React.FC = () => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (d3Container.current) {
      // Clear previous chart
      d3.select(d3Container.current).selectAll('*').remove();

      // Sample data for 12 months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const categories = ['Clinical Audits', 'Policy Reviews'];
      
      const data: any[] = [];
      categories.forEach((category) => {
        months.forEach((month, idx) => {
          data.push({
            month,
            category,
            completed: Math.floor(Math.random() * 20) + 5,
            pending: Math.floor(Math.random() * 10),
            total: 0
          });
        });
      });
      data.forEach(d => d.total = d.completed + d.pending);

      const margin = { top: 20, right: 30, bottom: 30, left: 100 };
      const width = 600 - margin.left - margin.right;
      const height = 150 - margin.top - margin.bottom;

      const svg = d3.select(d3Container.current)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // X scale
      const x = d3.scaleBand()
        .range([0, width])
        .domain(months)
        .padding(0.05);

      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .select('.domain').remove();

      // Y scale
      const y = d3.scaleBand()
        .range([height, 0])
        .domain(categories)
        .padding(0.05);

      svg.append('g')
        .call(d3.axisLeft(y).tickSize(0))
        .select('.domain').remove();

      // Color scale based on pending audits (risk proxy)
      const colorScale = d3.scaleLinear<string>()
        .range(['#10b981', '#f43f5e']) // emerald-500 to rose-500
        .domain([0, 10]); 

      svg.selectAll()
        .data(data, (d: any) => `${d.category}:${d.month}`)
        .enter()
        .append('rect')
        .attr('x', (d) => x(d.month)!)
        .attr('y', (d) => y(d.category)!)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', (d) => colorScale(d.pending))
        .append('title')
        .text((d) => `${d.category} - ${d.month}\nCompleted: ${d.completed}\nPending: ${d.pending}`);
    }
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white">Compliance Risk Heatmap (12 Months)</h3>
          <p className="text-xs text-slate-400 mt-0.5">D3.js Visualization of pending vs. completed audits</p>
        </div>
      </div>
      <div className="overflow-x-auto overflow-y-hidden flex items-center justify-center">
        <div ref={d3Container} className="min-w-[600px] font-sans text-slate-400 text-xs" />
      </div>
    </div>
  );
};
