import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Printer, Search, Loader2, Calendar, User, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface CidOption {
  code: string;
  description: string;
}

export default function App() {
  const [patientName, setPatientName] = useState('');
  const [days, setDays] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cidSearch, setCidSearch] = useState('');
  const [cidOptions, setCidOptions] = useState<CidOption[]>([]);
  const [selectedCid, setSelectedCid] = useState<CidOption | null>(null);
  const [isSearchingCid, setIsSearchingCid] = useState(false);
  const [showCidDropdown, setShowCidDropdown] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Current date parts for the footer
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const monthNames = [
    "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
    "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
  ];
  const month = monthNames[today.getMonth()];
  const year = today.getFullYear();

  // Format start date for display
  const formattedStartDate = startDate.split('-').reverse().join('/');

  const searchCid = async (query: string) => {
    if (query.length < 3) return;
    
    setIsSearchingCid(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Aja como um especialista em CID-10. Busque códigos CID-10 relacionados a: "${query}". 
        Retorne apenas um JSON array de objetos com as propriedades "code" e "description". 
        Exemplo: [{"code": "J11", "description": "Gripe"}]`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || '[]');
      setCidOptions(result);
      setShowCidDropdown(true);
    } catch (error) {
      console.error("Error searching CID:", error);
    } finally {
      setIsSearchingCid(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cidSearch && !selectedCid) {
        searchCid(cidSearch);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [cidSearch]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-100">
      {/* Sidebar Controls */}
      <div className="w-full md:w-96 bg-white border-r border-slate-200 p-6 no-print overflow-y-auto h-screen sticky top-0">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileText className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Gerador de Atestado</h1>
        </div>

        <div className="space-y-6">
          {/* Patient Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <User size={16} /> Nome do Paciente
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Digite o nome completo"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Days and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Clock size={16} /> Dias de Licença
              </label>
              <input
                type="number"
                min="1"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                <Calendar size={16} /> Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* CID Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Search size={16} /> CID-10 (Doença ou Código)
            </label>
            <div className="relative">
              <input
                type="text"
                value={cidSearch}
                onChange={(e) => {
                  setCidSearch(e.target.value);
                  setSelectedCid(null);
                }}
                placeholder="Ex: Gripe ou J11"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              {isSearchingCid && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
            </div>

            <AnimatePresence>
              {showCidDropdown && cidOptions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                >
                  {cidOptions.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => {
                        setSelectedCid(option);
                        setCidSearch(`${option.code} - ${option.description}`);
                        setShowCidDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                    >
                      <span className="font-bold text-blue-600">{option.code}</span>
                      <p className="text-sm text-slate-600 truncate">{option.description}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Printer size={20} /> Imprimir Atestado
          </button>

          <div className="pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 leading-relaxed">
              * Este é um gerador de layout. O atestado só tem validade legal quando assinado e carimbado por um médico devidamente registrado no CRM.
            </p>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-4 md:p-12 flex justify-center items-start overflow-y-auto bg-slate-200">
        <div 
          ref={printRef}
          className="print-area w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] flex flex-col font-serif"
        >
          {/* Header with Logo */}
          <div className="flex flex-col items-center mb-16">
            <img 
              src="https://f000.backblazeb2.com/file/jpgshared/HQ4bOuqO" 
              alt="Logo" 
              className="h-24 object-contain mb-4"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-16 tracking-widest uppercase">
            ATESTADO
          </h2>

          {/* Content */}
          <div className="text-xl leading-[2] text-justify mb-16 px-8">
            <p>
              ATESTO para os devidos fins que o(a) paciente 
              <span className="inline-block border-b border-dotted border-slate-400 min-w-[300px] px-2 font-bold mx-2">
                {patientName || "____________________________________"}
              </span> 
              necessita de 
              <span className="inline-block border-b border-dotted border-slate-400 min-w-[40px] px-2 font-bold mx-2 text-center">
                {days || "___"}
              </span> 
              dias de licença, por motivo de doença a partir de 
              <span className="inline-block border-b border-dotted border-slate-400 min-w-[120px] px-2 font-bold mx-2 text-center">
                {formattedStartDate}
              </span>.
            </p>
          </div>

          {/* CID Section */}
          <div className="text-center mb-32">
            <p className="text-xl">
              CID: - <span className="font-bold">{selectedCid?.code || "X"}</span> -
            </p>
          </div>

          {/* Footer / Location & Date */}
          <div className="mt-auto">
            <div className="flex flex-col items-center">
              <div className="w-64 border-t border-slate-800 mb-2"></div>
              <p className="text-sm uppercase tracking-widest mb-12">Assinatura e Carimbo</p>
              
              <div className="text-xl uppercase tracking-widest flex items-center gap-4 mb-8">
                <span>CARUARU</span>
                <span className="font-bold">{day}</span>
                <span>DE</span>
                <span className="font-bold">{month}</span>
                <span>DE</span>
                <span className="font-bold">{year}</span>
              </div>

              <div className="text-center text-[10px] text-slate-400 font-sans mt-8 border-t border-slate-100 pt-4 w-full">
                Hospital Memorial São Gabriel - Av. Dr. Pedro Jordão, 752 - Maurício de Nassau, Caruaru - PE, 55014-320
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
