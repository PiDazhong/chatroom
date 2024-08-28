/**
 * @des 柱状图
 */
import React, { useEffect, useRef, useState } from 'react';
import * as _ from 'lodash';
import { Pie } from '@antv/g2plot';

const PieChart = ({
  chartData,
  padding = [0, 0, 0, -160],
  appendPadding = 30,
  xField = 'type',
  yField = 'value',
  width,
  height,
  autoFit = true,
}) => {
  const chartContanierRef = useRef();
  const chartRef = useRef(null);

  const all = _.reduce(chartData?.data, (p, c) => p + c.value, 0);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.changeData(chartData?.data || []);
    } else {
      chartRef.current = new Pie(chartContanierRef.current, {
        width,
        height,
        autoFit,
        padding,
        appendPadding,
        data: chartData?.data || [],
        angleField: yField,
        colorField: xField,
        radius: 0.9,
        innerRadius: 0.6,
        legend: {
          offsetX: -60,
          position: 'right',
        },
        label: {
          type: 'inner',
          offset: '-50%',
          content: (data) => {
            const { value, percent } = data;
            return `${value}\n(${(percent * 100)?.toFixed(0)}%)`;
          },
          style: {
            textAlign: 'center',
            fontSize: 12,
          },
        },
        interactions: [{ type: 'element-active' }],
        statistic: {
          title: {
            style: {
              fontSize: 12,
            },
            content: `日期: ${chartData?.trade_date}`,
          },
          content: {
            style: {
              fontSize: 12,
              marginTop: '4px',
            },
            content: `total: ${all}`,
          },
        },
      });
      chartRef.current.render();
    }
  }, [chartData]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current?.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  return (
    <div className="pie-chart">
      <div ref={chartContanierRef}></div>
    </div>
  );
};

export default PieChart;
