import React, { useState } from 'react';
import { Copy, Check, FileJson } from 'lucide-react';

const V2RayJsonParser = () => {
  const [parsedLinks, setParsedLinks] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [error, setError] = useState('');

  const parseJson = (jsonData) => {
    try {
      setError('');
      const configs = Array.isArray(jsonData) ? jsonData : [jsonData];
      const links = [];

      configs.forEach((config) => {
        const { outbounds, remarks } = config;
        
        outbounds.forEach((outbound) => {
          if (outbound.protocol === 'vless' && outbound.tag === 'proxy') {
            const settings = outbound.settings;
            const streamSettings = outbound.streamSettings;
            
            if (settings.vnext && settings.vnext[0]) {
              const vnext = settings.vnext[0];
              const user = vnext.users[0];
              
              const address = vnext.address;
              const port = vnext.port;
              const uuid = user.id;
              const encryption = user.encryption || 'none';
              const flow = user.flow || '';
              
              const network = streamSettings.network || 'tcp';
              const security = streamSettings.security || 'none';
              
              let params = new URLSearchParams();
              params.append('encryption', encryption);
              params.append('type', network);
              params.append('security', security);
              
              if (flow) {
                params.append('flow', flow);
              }
              
              if (network === 'ws' && streamSettings.wsSettings) {
                const ws = streamSettings.wsSettings;
                if (ws.host) params.append('host', ws.host);
                if (ws.path) params.append('path', ws.path);
              }
              
              if (security === 'tls' && streamSettings.tlsSettings) {
                const tls = streamSettings.tlsSettings;
                if (tls.serverName) params.append('sni', tls.serverName);
                if (tls.fingerprint) params.append('fp', tls.fingerprint);
                if (tls.alpn && tls.alpn.length > 0) {
                  params.append('alpn', tls.alpn.join(','));
                }
              }
              
              const link = `vless://${uuid}@${address}:${port}?${params.toString()}#${encodeURIComponent(remarks || 'V2Ray Config')}`;
              links.push({ link, remark: remarks || 'V2Ray Config' });
            }
          }
          
          if (outbound.protocol === 'vmess' && outbound.tag === 'proxy') {
            const settings = outbound.settings;
            const streamSettings = outbound.streamSettings;
            
            if (settings.vnext && settings.vnext[0]) {
              const vnext = settings.vnext[0];
              const user = vnext.users[0];
              
              const vmessConfig = {
                v: '2',
                ps: remarks || 'V2Ray Config',
                add: vnext.address,
                port: vnext.port.toString(),
                id: user.id,
                aid: '0',
                scy: user.security || 'auto',
                net: streamSettings.network || 'tcp',
                type: 'none',
                host: '',
                path: '',
                tls: streamSettings.security || 'none',
                sni: '',
                alpn: '',
                fp: ''
              };
              
              if (streamSettings.network === 'ws' && streamSettings.wsSettings) {
                const ws = streamSettings.wsSettings;
                vmessConfig.host = ws.host || '';
                vmessConfig.path = ws.path || '';
              }
              
              if (streamSettings.security === 'tls' && streamSettings.tlsSettings) {
                const tls = streamSettings.tlsSettings;
                vmessConfig.sni = tls.serverName || '';
                vmessConfig.fp = tls.fingerprint || '';
                if (tls.alpn && tls.alpn.length > 0) {
                  vmessConfig.alpn = tls.alpn.join(',');
                }
              }
              
              const link = 'vmess://' + btoa(JSON.stringify(vmessConfig));
              links.push({ link, remark: remarks || 'V2Ray Config' });
            }
          }

          if (outbound.protocol === 'trojan' && outbound.tag === 'proxy') {
            const settings = outbound.settings;
            const streamSettings = outbound.streamSettings;
            
            if (settings.servers && settings.servers[0]) {
              const server = settings.servers[0];
              
              const address = server.address;
              const port = server.port;
              const password = server.password;
              
              const network = streamSettings.network || 'tcp';
              const security = streamSettings.security || 'none';
              
              let params = new URLSearchParams();
              params.append('type', network);
              params.append('security', security);
              
              if (network === 'ws' && streamSettings.wsSettings) {
                const ws = streamSettings.wsSettings;
                if (ws.host) params.append('host', ws.host);
                if (ws.path) params.append('path', ws.path);
              }
              
              if (security === 'tls' && streamSettings.tlsSettings) {
                const tls = streamSettings.tlsSettings;
                if (tls.serverName) params.append('sni', tls.serverName);
                if (tls.fingerprint) params.append('fp', tls.fingerprint);
                if (tls.alpn && tls.alpn.length > 0) {
                  params.append('alpn', tls.alpn.join(','));
                }
              }
              
              const link = `trojan://${password}@${address}:${port}?${params.toString()}#${encodeURIComponent(remarks || 'V2Ray Config')}`;
              links.push({ link, remark: remarks || 'V2Ray Config' });
            }
          }
        });
      });

      setParsedLinks(links);
    } catch (err) {
      setError('Ошибка парсинга JSON: ' + err.message);
      setParsedLinks([]);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          parseJson(jsonData);
        } catch (err) {
          setError('Неверный формат JSON файла');
        }
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const copyAllLinks = () => {
    const allLinks = parsedLinks.map(item => item.link).join('\n');
    navigator.clipboard.writeText(allLinks).then(() => {
      setCopiedIndex('all');
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <FileJson className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">V2Ray JSON Parser</h1>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-purple-200">
              Загрузите JSON файл
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-purple-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer cursor-pointer bg-white/5 rounded-lg border border-white/20 p-2"
            />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {parsedLinks.length > 0 && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-purple-200">
                Найдено конфигураций: <span className="font-bold text-white">{parsedLinks.length}</span>
              </p>
              <button
                onClick={copyAllLinks}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                {copiedIndex === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Копировать все
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {parsedLinks.map((item, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">
                    {item.remark}
                  </h3>
                  <div className="bg-black/30 rounded-lg p-3 overflow-x-auto">
                    <code className="text-sm text-purple-200 break-all">
                      {item.link}
                    </code>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(item.link, index)}
                  className="flex-shrink-0 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  title="Копировать"
                >
                  {copiedIndex === index ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default V2RayJsonParser;