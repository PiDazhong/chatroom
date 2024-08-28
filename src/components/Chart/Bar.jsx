/**
 * @des 柱状图
 */
import React, { useEffect, useRef, useState } from 'react';
import * as _ from 'lodash';
import { Column } from '@antv/g2plot';

const Bar = ({
  chartData,
  xField,
  yField,
  seriesField,
  width,
  height,
  autoFit = true,
  isGroup = true,
}) => {
  const chartContanierRef = useRef();
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.changeData(chartData);
    } else {
      chartRef.current = new Column(chartContanierRef.current, {
        width,
        height,
        autoFit,
        data: chartData || [],
        isGroup,
        xField,
        yField,
        seriesField,
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
    <div className="bar-chart">
      <div ref={chartContanierRef}></div>
    </div>
  );
};

export default Bar;
