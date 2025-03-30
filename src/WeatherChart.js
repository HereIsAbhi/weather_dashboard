import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const WeatherChart = ({ hourlyData }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    console.log('Hourly Data:', hourlyData);
    if (!hourlyData || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    const labels = hourlyData.map(data => new Date(data.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const temperatures = hourlyData.map(data => data.temp);
    const humidities = hourlyData.map(data => data.humidity);

    const chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temperatures,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            yAxisID: 'y',
          },
          {
            label: 'Humidity (%)',
            data: humidities,
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        stacked: false,
        plugins: {
          title: {
            display: true,
            text: '24-Hour Weather Trends',
          },
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    });

    return () => {
      chartInstance.destroy();
    };
  }, [hourlyData]);

  return <canvas ref={chartRef} />;
};

export default WeatherChart; 