'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, RefreshCw, Palette, Mail, Phone, Wifi, MessageCircle, Link2, Type, Send, Play, Calendar } from 'lucide-react';

declare global {
  interface Window {
    yaContextCb: (() => void)[];
    Ya: any;
  }
}

type DataType = 'text' | 'url' | 'email' | 'phone' | 'sms' | 'wifi' | 'telegram' | 'youtube' | 'event';

interface WifiConfig {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
}

interface EventConfig {
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
}

export default function QRGenerator() {
  const [dataType, setDataType] = useState<DataType>('url');
  
  // Текст и ссылки
  const [textValue, setTextValue] = useState('');
  const [urlValue, setUrlValue] = useState('');
  
  // Email
  const [emailValue, setEmailValue] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  
  // Телефон и SMS
  const [phoneValue, setPhoneValue] = useState('');
  const [smsNumber, setSmsNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  
  // Wi-Fi
  const [wifiConfig, setWifiConfig] = useState<WifiConfig>({
    ssid: '',
    password: '',
    encryption: 'WPA'
  });
  
  // Telegram
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramType, setTelegramType] = useState<'username' | 'channel' | 'invite'>('username');
  
  // YouTube
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeType, setYoutubeType] = useState<'video' | 'channel' | 'playlist'>('video');
  
  // Мероприятие (календарь)
  const [eventConfig, setEventConfig] = useState<EventConfig>({
    title: '',
    description: '',
    location: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  // Настройки дизайна
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState(280);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [includeMargin, setIncludeMargin] = useState(true);

  const qrRef = useRef<HTMLDivElement>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  // Генерация значения для QR-кода
  const getQRValue = () => {
    switch (dataType) {
      case 'text':
        return textValue;
      case 'url':
        return urlValue;
      case 'email':
        if (!emailValue) return '';
        let emailStr = `mailto:${emailValue}`;
        if (emailSubject || emailBody) {
          emailStr += '?';
          if (emailSubject) emailStr += `subject=${encodeURIComponent(emailSubject)}`;
          if (emailSubject && emailBody) emailStr += '&';
          if (emailBody) emailStr += `body=${encodeURIComponent(emailBody)}`;
        }
        return emailStr;
      case 'phone':
        return phoneValue ? `tel:${phoneValue}` : '';
      case 'sms':
        if (!smsNumber) return '';
        let smsStr = `sms:${smsNumber}`;
        if (smsMessage) smsStr += `?body=${encodeURIComponent(smsMessage)}`;
        return smsStr;
      case 'wifi':
        if (!wifiConfig.ssid) return '';
        const auth = wifiConfig.encryption === 'nopass' ? 'nopass' : wifiConfig.encryption;
        const passwordPart = wifiConfig.encryption !== 'nopass' && wifiConfig.password ? `:${wifiConfig.password}` : '';
        return `WIFI:T:${auth};S:${wifiConfig.ssid};${passwordPart};;`;
      case 'telegram':
        if (telegramType === 'username' && telegramUsername) {
          return `https://t.me/${telegramUsername.replace('@', '')}`;
        } else if (telegramType === 'channel' && telegramUsername) {
          return `https://t.me/${telegramUsername.replace('@', '')}`;
        } else if (telegramType === 'invite' && telegramUsername) {
          return `https://t.me/joinchat/${telegramUsername}`;
        }
        return '';
      case 'youtube':
        if (!youtubeUrl) return '';
        // Очищаем URL от лишнего
        let cleanUrl = youtubeUrl.trim();
        if (youtubeType === 'video' && !cleanUrl.includes('watch?v=') && !cleanUrl.includes('youtu.be/')) {
          return `https://www.youtube.com/watch?v=${cleanUrl}`;
        }
        return cleanUrl;
      case 'event':
        if (!eventConfig.title || !eventConfig.startDate) return '';
        // Формируем vCalendar формат (iCal)
        const startDateTime = `${eventConfig.startDate.replace(/-/g, '')}T${eventConfig.startTime.replace(/:/g, '')}00`;
        const endDateTime = eventConfig.endDate && eventConfig.endTime
          ? `${eventConfig.endDate.replace(/-/g, '')}T${eventConfig.endTime.replace(/:/g, '')}00`
          : startDateTime;
        
        const eventString = `BEGIN:VEVENT
SUMMARY:${eventConfig.title}
DESCRIPTION:${eventConfig.description || ''}
LOCATION:${eventConfig.location || ''}
DTSTART:${startDateTime}
DTEND:${endDateTime}
END:VEVENT`;
        
        return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//QR Generator//EN\n${eventString}\nEND:VCALENDAR`;
      default:
        return '';
    }
  };

  const qrValue = getQRValue();
  const hasValue = qrValue !== '';

  // Скачивание SVG
  const downloadSVG = () => {
    if (!hasValue) return;
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svg);
    svgString = svgString.replace('<svg', `<svg style="background-color: ${bgColor}"`);

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `qr-code-${Date.now()}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!hasValue) return;
    await navigator.clipboard.writeText(qrValue);
    alert('Значение скопировано в буфер обмена!');
  };

  const resetAll = () => {
    setTextValue('');
    setUrlValue('');
    setEmailValue('');
    setEmailSubject('');
    setEmailBody('');
    setPhoneValue('');
    setSmsNumber('');
    setSmsMessage('');
    setWifiConfig({ ssid: '', password: '', encryption: 'WPA' });
    setTelegramUsername('');
    setTelegramType('username');
    setYoutubeUrl('');
    setYoutubeType('video');
    setEventConfig({
      title: '',
      description: '',
      location: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    setFgColor('#000000');
    setBgColor('#ffffff');
  };

  // Загрузка рекламы
  useEffect(() => {
    if (scriptLoaded.current) return;
    scriptLoaded.current = true;

    window.yaContextCb = window.yaContextCb || [];

    const script = document.createElement('script');
    script.src = 'https://yandex.ru/ads/system/context.js';
    script.async = true;
    document.body.appendChild(script);

    const renderAd = () => {
      if (window.Ya?.Context?.AdvManager && adContainerRef.current) {
        try {
          window.Ya.Context.AdvManager.render({
            blockId: "R-A-19074412-1",
            renderTo: adContainerRef.current,
            async: true
          });
        } catch (e) {
          console.error('Ошибка рендера рекламы:', e);
        }
      }
    };

    if (window.Ya?.Context?.AdvManager) {
      renderAd();
    } else {
      window.yaContextCb.push(renderAd);
    }

    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Рендер полей ввода
  const renderInputFields = () => {
    switch (dataType) {
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Текст</label>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Введите любой текст..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
        );
      case 'url':
        return (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Ссылка (URL)</label>
            <input
              type="url"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        );
      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email адрес</label>
              <input
                type="email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder="example@mail.ru"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Тема письма (необязательно)</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Тема письма"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Текст письма (необязательно)</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Текст письма..."
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        );
      case 'phone':
        return (
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Номер телефона</label>
            <input
              type="tel"
              value={phoneValue}
              onChange={(e) => setPhoneValue(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        );
      case 'sms':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Номер телефона</label>
              <input
                type="tel"
                value={smsNumber}
                onChange={(e) => setSmsNumber(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Текст SMS (необязательно)</label>
              <textarea
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Текст сообщения..."
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
          </div>
        );
      case 'wifi':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Название Wi-Fi (SSID)</label>
              <input
                type="text"
                value={wifiConfig.ssid}
                onChange={(e) => setWifiConfig({ ...wifiConfig, ssid: e.target.value })}
                placeholder="MyWiFi"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Тип шифрования</label>
              <select
                value={wifiConfig.encryption}
                onChange={(e) => setWifiConfig({ ...wifiConfig, encryption: e.target.value as any })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="WPA">WPA/WPA2 (рекомендуется)</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Без пароля</option>
              </select>
            </div>
            {wifiConfig.encryption !== 'nopass' && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Пароль Wi-Fi</label>
                <input
                  type="password"
                  value={wifiConfig.password}
                  onChange={(e) => setWifiConfig({ ...wifiConfig, password: e.target.value })}
                  placeholder="Пароль от Wi-Fi"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
          </div>
        );
      case 'telegram':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Тип ссылки</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setTelegramType('username')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    telegramType === 'username' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  Пользователь
                </button>
                <button
                  onClick={() => setTelegramType('channel')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    telegramType === 'channel' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  Канал
                </button>
                <button
                  onClick={() => setTelegramType('invite')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    telegramType === 'invite' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  Приглашение
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                {telegramType === 'invite' ? 'Код приглашения' : 'Username'}
              </label>
              <input
                type="text"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder={telegramType === 'invite' ? 'xxxxx-xxxxxx' : '@username'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'youtube':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Тип ссылки</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setYoutubeType('video')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    youtubeType === 'video' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  Видео
                </button>
                <button
                  onClick={() => setYoutubeType('channel')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    youtubeType === 'channel' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  Канал
                </button>
                <button
                  onClick={() => setYoutubeType('playlist')}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    youtubeType === 'playlist' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  Плейлист
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Ссылка YouTube</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... или ID видео"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        );
      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Название мероприятия *</label>
              <input
                type="text"
                value={eventConfig.title}
                onChange={(e) => setEventConfig({ ...eventConfig, title: e.target.value })}
                placeholder="Встреча, концерт, вебинар..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Описание (необязательно)</label>
              <textarea
                value={eventConfig.description}
                onChange={(e) => setEventConfig({ ...eventConfig, description: e.target.value })}
                placeholder="Подробности мероприятия..."
                rows={2}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Место проведения (необязательно)</label>
              <input
                type="text"
                value={eventConfig.location}
                onChange={(e) => setEventConfig({ ...eventConfig, location: e.target.value })}
                placeholder="Адрес, ссылка на Zoom..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Дата начала *</label>
                <input
                  type="date"
                  value={eventConfig.startDate}
                  onChange={(e) => setEventConfig({ ...eventConfig, startDate: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Время начала</label>
                <input
                  type="time"
                  value={eventConfig.startTime}
                  onChange={(e) => setEventConfig({ ...eventConfig, startTime: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Дата окончания</label>
                <input
                  type="date"
                  value={eventConfig.endDate}
                  onChange={(e) => setEventConfig({ ...eventConfig, endDate: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Время окончания</label>
                <input
                  type="time"
                  value={eventConfig.endTime}
                  onChange={(e) => setEventConfig({ ...eventConfig, endTime: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-zinc-500 text-xs">* — обязательные поля. QR-код добавит событие в календарь телефона.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <head>
        <title>QR Code Generator — Создай QR-код бесплатно онлайн</title>
        <meta name="description" content="Бесплатный генератор QR-кодов онлайн. Создавай QR-коды для ссылок, текста, email, телефона, SMS, Wi-Fi, Telegram, YouTube и мероприятий. Скачивай в формате SVG." />
        <meta name="keywords" content="qr код, генератор qr кода, создать qr код, qr для телеграм, qr для youtube, qr для мероприятия, qr code generator" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta property="og:title" content="QR Code Generator — 9 типов QR-кодов" />
        <meta property="og:description" content="Создавай QR-коды для ссылок, текста, контактов, Wi-Fi, Telegram, YouTube и мероприятий. Мгновенно, бесплатно." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index, follow" />
      </head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 text-white">
        <div className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Шапка */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                QR Code Generator
              </h1>
              <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
                Создавай QR-коды для любых целей • 9 типов данных • Бесплатно
              </p>
            </div>

            {/* Блок с преимуществами */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">🔗</div>
                <p className="text-xs">Ссылки</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">📝</div>
                <p className="text-xs">Текст</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">📧</div>
                <p className="text-xs">Email</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">📞</div>
                <p className="text-xs">Телефон</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">📶</div>
                <p className="text-xs">Wi-Fi</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">💬</div>
                <p className="text-xs">Telegram</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">▶️</div>
                <p className="text-xs">YouTube</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">📅</div>
                <p className="text-xs">Мероприятия</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 text-xl mb-1">✉️</div>
                <p className="text-xs">SMS</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Левая колонка */}
              <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
                <div className="space-y-5">
                  {/* Выбор типа данных */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Тип данных</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setDataType('url')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'url' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Link2 size={14} /> Ссылка</button>
                      <button onClick={() => setDataType('text')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'text' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Type size={14} /> Текст</button>
                      <button onClick={() => setDataType('email')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'email' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Mail size={14} /> Email</button>
                      <button onClick={() => setDataType('phone')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'phone' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Phone size={14} /> Телефон</button>
                      <button onClick={() => setDataType('sms')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'sms' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><MessageCircle size={14} /> SMS</button>
                      <button onClick={() => setDataType('wifi')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'wifi' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Wifi size={14} /> Wi-Fi</button>
                      <button onClick={() => setDataType('telegram')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'telegram' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Send size={14} /> Telegram</button>
                      <button onClick={() => setDataType('youtube')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'youtube' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Play size={14} /> YouTube</button>
                      <button onClick={() => setDataType('event')} className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${dataType === 'event' ? 'bg-blue-600 text-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}><Calendar size={14} /> Мероприятие</button>
                    </div>
                  </div>

                  {renderInputFields()}

                  {/* Настройки дизайна */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Цвет QR-кода</label>
                      <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-2">
                        <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" />
                        <span className="font-mono text-sm">{fgColor}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Цвет фона</label>
                      <div className="flex items-center gap-3 bg-zinc-800 rounded-2xl p-2">
                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer" />
                        <span className="font-mono text-sm">{bgColor}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Размер: {size} px</label>
                    <input type="range" min="180" max="420" step="10" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-blue-500" />
                  </div>

                  <button onClick={resetAll} className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-colors">
                    <RefreshCw size={18} /> Сбросить всё
                  </button>
                </div>
              </div>

              {/* Правая колонка — предпросмотр */}
              <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-zinc-950 rounded-2xl p-8 min-h-[340px]" ref={qrRef}>
                  {hasValue ? (
                    <div className="p-6 bg-white rounded-2xl shadow-2xl">
                      <QRCodeSVG value={qrValue} size={size} fgColor={fgColor} bgColor={bgColor} level={errorLevel} includeMargin={includeMargin} />
                    </div>
                  ) : (
                    <div className="text-center text-zinc-500">
                      <Palette size={64} className="mx-auto mb-4 opacity-50" />
                      <p className="text-xl">Заполните данные<br />и QR-код появится здесь</p>
                    </div>
                  )}
                </div>

                {hasValue && (
                  <div className="mt-6 flex gap-4">
                    <button onClick={downloadSVG} className="flex-1 flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-2xl hover:bg-zinc-200 transition-colors">
                      <Download size={20} /> Скачать SVG
                    </button>
                    <button onClick={copyToClipboard} className="flex-1 flex items-center justify-center gap-3 bg-zinc-800 font-semibold py-4 rounded-2xl hover:bg-zinc-700 transition-colors border border-zinc-700">
                      <Copy size={20} /> Копировать
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Реклама */}
            <div className="mt-12 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 text-center">
              <div ref={adContainerRef} className="flex justify-center items-center min-h-[90px]" />
              <p className="text-zinc-500 text-xs mt-3">Реклама</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-800 mt-8 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">QR Code Generator</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">Бесплатный инструмент для создания QR-кодов любых типов: ссылки, контакты, Wi-Fi, Telegram, YouTube и мероприятия.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Что такое QR-код?</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">QR-код (Quick Response code) — это двумерный штрихкод, содержащий закодированную информацию. Достаточно навести камеру смартфона, чтобы перейти по ссылке, увидеть текст, добавить контакт, подключиться к Wi-Fi или добавить событие в календарь.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-3">Как использовать?</h4>
                <ul className="text-zinc-400 text-sm space-y-2">
                  <li>1. Выберите тип данных (ссылка, Telegram, мероприятие и т.д.)</li>
                  <li>2. Заполните необходимые поля</li>
                  <li>3. Настройте цвет и размер</li>
                  <li>4. Скачайте QR-код в формате SVG</li>
                  <li>5. Разместите на сайте, визитке или рекламе</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-zinc-800 mt-8 pt-6 text-center text-zinc-500 text-xs">
              <p>© {new Date().getFullYear()} QR Code Generator. Все права защищены.</p>
              <p className="mt-1">Данный сайт использует рекламу для поддержания бесплатной работы сервиса.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}