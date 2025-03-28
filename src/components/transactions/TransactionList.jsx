// src/components/transactions/TransactionList.jsx
import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip from '../common/Tooltip';
import { subscribe } from '../../utils/upbitWebSocket';

function TransactionList({ title, symbol = 'BTC', isWhale = false }) {
  const [transactions, setTransactions] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const scrollRef = useRef(null);
  const componentId = useId();
  
  // 숫자를 한국어 단위로 포맷팅하는 함수 (억, 천만, 백만 등)
  const formatKoreanNumber = (num) => {
    if (num === 0) return '0원';
    if (num < 10000) {
      return num.toLocaleString('ko-KR') + '원';
    }
    
    const units = ['', '만', '억', '조'];
    let result = '';
    let unitIndex = 0;
    let remainder = num;
    
    while (remainder > 0) {
      const digit = remainder % 10000;
      if (digit > 0) {
        result = (digit > 0 ? digit.toLocaleString('ko-KR') + units[unitIndex] : '') + result;
      }
      unitIndex++;
      remainder = Math.floor(remainder / 10000);
    }
    
    return result + '원';
  };
  
  useEffect(() => {
    // symbol이 바뀌면 기존 거래 내역을 초기화
    setTransactions([]);

    // 웹소켓 구독 설정
    const unsubscribeFunc = subscribe(
      `${componentId}_${isWhale ? 'whale' : 'normal'}`, 
      symbol,
      (data) => {
        // 데이터 형식 변환
        const transaction = {
          id: `${Date.now()}_${symbol}_${isWhale ? 'whale' : 'normal'}_${Math.random().toString(36).substring(2, 9)}`,
          coin: symbol,
          price: data.tp, // trade_price (매수/매도 가격)
          amount: data.tv, // trade_volume
          type: data.ab === 'BID' ? 'buy' : 'sell', // ask_bid (BID: 매수, ASK: 매도)
          time: new Date(data.tms).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) // trade_timestamp
        };
        
        setTransactions(prev => {
          const newTransactions = [transaction, ...prev].slice(0, 50);
          return newTransactions;
        });
      },
      isWhale // 고래 거래 여부
    );
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      if (unsubscribeFunc) {
        unsubscribeFunc();
      }
    };
  }, [symbol, isWhale, componentId]);
  
  // 스크롤바 스타일
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.1);
    }
    .custom-scrollbar::-webkit-scrollbar-horizontal {
      display: none;
    }
  `;

  // 코인 이름 맵핑 (심볼 -> 한글 이름)
  const coinNames = {
    'BTC': '비트코인',
    'USDC': 'USD 코인',
    'NEO': '네오',
    'XRP': '리플',
    'ETC': '이더리움 클래식'
  };

  return (
    <div className="bg-blue-900 rounded-lg p-4 flex flex-col h-[300px] relative">
      <style>{scrollbarStyles}</style>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white text-xl font-bold">{title}</h3>
        <div className="relative">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 text-white opacity-50 cursor-pointer hover:opacity-100" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          
          <Tooltip visible={showTooltip}>
            {isWhale ? (
              <p className="leading-relaxed">1,000만원 이상의 {symbol} 거래를 실시간으로 표시합니다.</p>
            ) : (
              <p className="leading-relaxed">실시간으로 업데이트되는 {symbol} 거래 내역입니다.</p>
            )}
          </Tooltip>
        </div>
      </div>
      
      <div 
        ref={scrollRef} 
        className="overflow-y-auto overflow-x-hidden flex-grow custom-scrollbar"
        style={{ 
          height: "calc(100% - 2rem)",
          scrollbarWidth: 'thin'
        }}
      >
        <AnimatePresence>
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <motion.div 
                key={tx.id} 
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
                className={`mb-3 rounded-lg pr-3 flex overflow-hidden justify-between items-center w-full ${
                  tx.type === 'buy' 
                    ? 'bg-[#264D82]'
                    : 'bg-[#533676]'
                }`}
              >
                <div className="flex items-center">
                  {/* 왼쪽 컬러 바 */}
                  <div className={`w-2 h-16 rounded-l mr-3 ${
                    tx.type === 'buy' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                  }`}></div>
                  
                  <div className={`w-8 h-8 rounded-full mr-3 flex-shrink-0 flex items-center justify-center`}>
                    <img 
                      src={`https://static.upbit.com/logos/${symbol}.png`} 
                      alt={`${symbol} 로고`}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/30?text=" + symbol.charAt(0);
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-white text-base font-bold">{symbol}</p>
                    <p className="text-gray-400 text-sm">{tx.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col items-end">
                    <p className={`font-bold text-lg ${tx.type === 'buy' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {formatKoreanNumber(tx.price * tx.amount)}
                    </p>
                    <div className="flex flex-col items-end text-xs text-gray-300">
                      <p>{tx.amount.toFixed(6)} {symbol}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex items-center justify-center h-24 text-gray-400 text-lg">
              {isWhale 
                ? '조용하네요... 고래가 나타나길 기다리는 중입니다. 🐳'
                : '아직 체결 내역이 없습니다. 거래를 기다리는 중입니다. ⏳'}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TransactionList;