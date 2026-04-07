'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, RefreshCw, Palette } from 'lucide-react';

export default function QRGenerator() {
  const [value, setValue] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(280);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [includeMargin, setIncludeMargin] = useState(true);

  const qrRef = useRef<HTMLDivElement>(null);

  // Скачивание PNG
  // Скачивание PNG (работает с QRCodeSVG)
// Скачивание PNG (исправленная версия)
const downloadPNG = async () => {
  if (!value || !qrRef.current) return;

  try {
    // Импортируем html2canvas динамически
    const html2canvas = (await import('html2canvas')).default;

    // Находим SVG элемент внутри рефа
    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) {
      alert('QR-код не найден');
      return;
    }

    // Создаём обёртку с фоном, чтобы сохранить стили
    const wrapper = document.createElement('div');
    wrapper.style.backgroundColor = bgColor;
    wrapper.style.display = 'inline-block';
    wrapper.style.padding = includeMargin ? '20px' : '0px';
    wrapper.style.borderRadius = '16px';
    
    // Клонируем SVG, чтобы не влиять на оригинал
    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    wrapper.appendChild(clonedSvg);
    
    // Временно добавляем в DOM для рендеринга
    document.body.appendChild(wrapper);
    
    // Рендерим в canvas
    const canvas = await html2canvas(wrapper, {
      scale: 3,                    // высокое качество
      backgroundColor: bgColor,
      logging: false,
      useCORS: true,
    });
    
    // Удаляем временный элемент
    document.body.removeChild(wrapper);
    
    // Скачиваем
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
  } catch (err) {
    console.error('Ошибка при создании PNG:', err);
    alert('Ошибка при создании PNG. Попробуй использовать кнопку SVG.');
  }
};

  // Скачивание SVG
  const downloadSVG = () => {
    if (!value) return;
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);

    // Добавляем белый фон
    svgString = svgString.replace(
      '<svg',
      `<svg style="background-color: ${bgColor}"`
    );

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.svg`;
    link.href = url
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    alert('Текст скопирован в буфер обмена!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            QR Code Generator
          </h1>
          <p className="text-zinc-400 text-lg">
            Создавай стильные QR-коды бесплатно • Мгновенно 
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Левая колонка — настройки */}
          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Текст или ссылка
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="https://example.com или любой текст"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {value && (
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <Copy size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Цвет QR-кода</label>
                  <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer"
                    />
                    <span className="font-mono text-sm">{fgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Фон</label>
                  <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer"
                    />
                    <span className="font-mono text-sm">{bgColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Размер: {size} px
                </label>
                <input
                  type="range"
                  min="180"
                  max="420"
                  step="10"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Уровень коррекции ошибок</label>
                <div className="flex gap-2">
                  {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setErrorLevel(level)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all ${
                        errorLevel === level 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                    >
                      {level} {level === 'H' && '(лучше для логотипа)'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setValue('');
                  setFgColor('#000000');
                  setBgColor('#ffffff');
                }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-colors"
              >
                <RefreshCw size={18} />
                Очистить всё
              </button>
            </div>
          </div>

          {/* Правая колонка — предпросмотр QR */}
          <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800 flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-zinc-950 rounded-2xl p-8 min-h-[340px]" ref={qrRef}>
              {value ? (
                <div className="p-6 bg-white rounded-2xl shadow-2xl">
                  <QRCodeSVG
                    value={value}
                    size={size}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={errorLevel}
                    includeMargin={includeMargin}
                  />
                </div>
              ) : (
                <div className="text-center text-zinc-500">
                  <Palette size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Введи текст или ссылку<br />и QR-код появится здесь</p>
                </div>
              )}
            </div>

            {value && (
              <div className="mt-8 flex gap-4">
                <button
                  onClick={downloadPNG}
                  className="flex-1 flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-2xl hover:bg-zinc-200 transition-colors"
                >
                  <Download size={20} />
                  Скачать PNG
                </button>
                
                <button
                  onClick={downloadSVG}
                  className="flex-1 flex items-center justify-center gap-3 bg-zinc-800 font-semibold py-4 rounded-2xl hover:bg-zinc-700 transition-colors border border-zinc-700"
                >
                  <Download size={20} />
                  Скачать SVG
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Место для рекламного баннера (горизонтальный) */}
        <div className="mt-12 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 text-center text-zinc-500 text-sm">
          Здесь будет рекламный баннер (AdSense / Raptive / Ezoic и т.д.)
          <br />
          <span className="text-xs mt-2 block">Реклама помогает проекту оставаться бесплатным для всех</span>
        </div>
      </div>
    </div>
  );
}