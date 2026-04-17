import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Info, 
  Search, 
  Bell, 
  User, 
  ChevronDown, 
  Menu, 
  X, 
  LogOut, 
  Shield, 
  Heart, 
  Home, 
  Video, 
  LayoutDashboard, 
  MessageSquare,
  TrendingUp,
  Clock,
  Plus,
  Send,
  Lock,
  DollarSign,
  PieChart,
  Users,
  Settings,
  BrainCircuit,
  BookOpen,
  Mic2,
  Camera,
  List as ListIcon
} from 'lucide-react';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { UserRole, UserProfile, PrayerRequest, FinanceRecord } from './types';

// Constants
const PRIMARY_BLUE = "#0088FF";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Not throwing here to prevent crashing the whole app, but logging is essential for the agent
}

const LIVES = [
  { id: 'sZbnLU8KKGY', title: 'CULTO COM O GRUPO ESTRELA DA MANHÃ', category: 'Ao Vivo', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '02:15:00', views: '1.2k' },
  { id: 'b0fd-_2zdWE', title: 'CULTO ESPECIAL DEDICADO ÀS FAMÍLIAS', category: 'Família', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '01:45:00', views: '800' },
  { id: 'TaOa7IF1-rU', title: 'CULTO DE LIBERTAÇÃO', category: 'Oração', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '03:10:00', views: '2.5k' },
  { id: '7q09tDTJqcU', title: 'CULTO DE SANTA CEIA - CELEBRAÇÃO', category: 'Especial', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '02:50:00', views: '3.1k' },
  { id: 'swdsExD0Av8', title: 'CULTO DA FAMÍLIA', category: 'Família', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '01:30:00', views: '950' },
  { id: 'Qp5Fg3Cnu1A', title: 'CULTO ESPECIAL DE ADORAÇÃO', category: 'Adoração', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '04:00:00', views: '1.8k' },
  { id: 'pFxcAj_ctyQ', title: 'CULTO DE SÁBADO', category: 'Celebração', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '02:00:00', views: '1.5k' },
  { id: 'f4pP20TIqr0', title: '1° SEXTA QUEBRANDO CADEIAS', category: 'Libertação', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '02:20:00', views: '1.1k' },
  { id: 'QXT4D7emy0Q', title: 'CULTO DE AGRADECIMENTO - JANEIRO PROFÉTICO', category: 'Celebração', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '02:30:00', views: '2.4k' },
  { id: 'n1ubVG6AEcs', title: 'ÚLTIMO ELO DA CAMPANHA O ANO DA VIRADA', category: 'Campanha', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '01:50:00', views: '1.3k' },
  { id: 'TZYrC4Zow0s', title: '10° ELO DA CAMPANHA A VIRADA DE CHAVE', category: 'Campanha', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '02:10:00', views: '1.4k' },
  { id: '_r0vjn6KqJ4', title: '9° ELO DA CAMPANHA O ANO DA VIRADA DE CHAVE', category: 'Campanha', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '01:40:00', views: '900' },
  { id: '0wF79v99_3s', title: '8° ELO DA CAMPANHA O ANO DA VIRADA DE CHAVE', category: 'Campanha', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '02:45:00', views: '1.7k' },
  { id: 'DgsrdnYCLw4', title: '7° ELO DA CAMPANHA O ANO DA VIRADA DE CHAVE', category: 'Campanha', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '02:15:00', views: '1.9k' },
  { id: 'd2rnQ1P395E', title: '6° ELO DA CAMPANHA O ANO DA VIRADA DE CHAVE', category: 'Campanha', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '02:30:00', views: '2.1k' },
  { id: 'mfvp8S2yfoA', title: '5° ELO DA CAMPANHA A VIRADA DE CHAVE', category: 'Campanha', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '01:55:00', views: '1.1k' },
  { id: 's5fyFp1zcpo', title: '4° ELO DA CAMPANHA O ANO DA VIRADA', category: 'Campanha', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '02:10:00', views: '1.5k' },
  { id: 'u5TGtDibhbI', title: '3° ELO DA CAMPANHA O ANO DA VIRADA', category: 'Campanha', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '01:50:00', views: '1.2k' },
  { id: 'QQ_UT5Oz5Z4', title: 'ANO DA VIRADA - A VIRADA DE CHAVE', category: 'Campanha', thumbnail: `/api/asset/7074218b-5975-4c07-9e45-d850eb26cc69?t=${Date.now()}`, duration: '03:15:00', views: '800' },
  { id: 'fqdrLlCls84', title: 'TRANSMISSÃO AO VIVO - AD BOM PASTOR', category: 'Ao Vivo', thumbnail: `/api/asset/5c26ef40-c7ba-4a49-9df5-60293f0b2131?t=${Date.now()}`, duration: '04:30:00', views: '3.2k' },
];

const MOVIES = [
  { id: 'm1', title: 'A Jornada da Fé', category: 'Filme', thumbnail: 'https://picsum.photos/seed/faith/1280/720', rating: '12+', match: '98%' },
  { id: 'm2', title: 'O Poder da Oração', category: 'Documentário', thumbnail: 'https://picsum.photos/seed/pray/1280/720', rating: 'L', match: '95%' },
  { id: 'm3', title: 'História das Missões', category: 'Série', thumbnail: 'https://picsum.photos/seed/mission/1280/720', rating: '10+', match: '92%' },
  { id: 'm4', title: 'Música e Adoração', category: 'Especial', thumbnail: 'https://picsum.photos/seed/music/1280/720', rating: 'L', match: '99%' },
];

// Components
const VideoRow = ({ title, videos, onVideoClick, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.8 }}
    className="space-y-4 py-8 relative"
  >
    <h3 className="text-xl md:text-2xl font-black italic ml-4 md:ml-12 text-white/90 tracking-tighter flex items-center gap-2">
      <div className="w-1 bg-primary h-6 rounded-full" />
      {title}
    </h3>
    <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-12 scroll-smooth pb-4">
      {videos.map((video) => (
        <motion.div
          key={video.id}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onVideoClick(video.id)}
          className="min-w-[280px] md:min-w-[340px] aspect-video bg-white/5 rounded-xl overflow-hidden cursor-pointer group relative shadow-2xl transition-all duration-500 hover:shadow-primary/20 border border-white/5"
        >
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
            <p className="text-primary text-xs font-black uppercase tracking-[0.2em] mb-1">{video.category}</p>
            <h4 className="font-black text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">{video.title}</h4>
          </div>
          <div className="absolute top-4 right-4 bg-primary/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play fill="white" size={14} />
          </div>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const MentorChat = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Bem-vindo ao Mentor IA AD Bom Pastor. Sou seu auxiliar teológico e ministerial. Em que posso te ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeModule, setActiveModule] = useState('teologo');
  const scrollRef = useRef<HTMLDivElement>(null);

  const modules = [
    { id: 'teologo', name: 'Mestre Teólogo', icon: <BookOpen />, desc: 'Esclarece dúvidas doutrinárias e teológicas profundas.' },
    { id: 'pregador', name: 'Mestre Homilética', icon: <Mic2 />, desc: 'Auxilia na elaboração de sermões e técnicas de pregação.' },
    { id: 'lider', name: 'Gestão Ministerial', icon: <Users />, desc: 'Conselhos sobre liderança e administração de grupos.' },
    { id: 'conselheiro', name: 'Conselheiro Espiritual', icon: <Heart />, desc: 'Apoio em questões pastorais e de aconselhamento.' },
    { id: 'missiologo', name: 'Visão Missionária', icon: <TrendingUp />, desc: 'Estratégias para evangelismo e missões locais.' },
    { id: 'musico', name: 'Ministro de Louvor', icon: <Mic2 />, desc: 'Orientação sobre liturgia e adoração musical.' },
    { id: 'educador', name: 'Pedagogia Bíblica', icon: <LayoutDashboard />, desc: 'Métodos de ensino para EBD e discipulado.' },
    { id: 'historiador', name: 'História da Igreja', icon: <Clock />, desc: 'Contexto histórico do cristianismo e pentecostalismo.' },
    { id: 'secretario', name: 'Estatuto & Regras', icon: <ListIcon />, desc: 'Orientações sobre normas e estatuto da igreja.' },
    { id: 'biblista', name: 'Exegese Bíblica', icon: <BrainCircuit />, desc: 'Estudo detalhado de textos originais e traduções.' },
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `Aja como um ${modules.find(m => m.id === activeModule)?.name}. Contexto: Igreja Assembleia de Deus Bom Pastor. Responda de forma bíblica e profissional à seguinte dúvida: ${userMsg}` }] }
        ],
      });
      
      const response = await model;
      setMessages(prev => [...prev, { role: 'assistant', text: response.text ?? "Desculpe, tive um problema ao processar sua dúvida bíblica." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: "Erro na conexão com o Mentor IA." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-200px)]">
      {/* Search Sidebar/Modules */}
      <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2 no-scrollbar">
        <h4 className="text-sm font-black text-primary tracking-widest uppercase mb-6 px-2">Especialidades</h4>
        {modules.map((m) => (
          <motion.div
            key={m.id}
            whileHover={{ scale: 1.02, x: 5 }}
            onClick={() => setActiveModule(m.id)}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${activeModule === m.id ? 'bg-primary/20 border-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className={activeModule === m.id ? 'text-primary' : 'text-white/40'}>{m.icon}</span>
              <span className="font-black text-sm">{m.name}</span>
            </div>
            <p className="text-[10px] text-netflix-gray leading-tight">{m.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-9 bg-white/5 rounded-3xl border border-white/5 flex flex-col overflow-hidden relative backdrop-blur-3xl shadow-2xl">
        <div className="bg-black/40 p-6 border-bottom border-white/5 backdrop-blur-xl z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-primary/30 shadow-lg shadow-primary/20 p-1 bg-white">
              <img src="https://lh3.googleusercontent.com/d/1EZxEDe93F2ZCtDGrBXXhVIhmWAN5xZyo" alt="Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight">Mentor AD Bom Pastor</h3>
              <p className="text-xs text-primary font-bold">{modules.find(m => m.id === activeModule)?.name} Ativo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Sistema Online</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
          {messages.map((m, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-6 rounded-3xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-primary text-white font-medium rounded-tr-none shadow-xl shadow-primary/20' : 'bg-white/10 border border-white/5 rounded-tl-none backdrop-blur-md'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/10 p-6 rounded-3xl rounded-tl-none flex gap-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-6 bg-black/40 backdrop-blur-xl border-t border-white/5 flex gap-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida bíblica ou administrativa..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all text-sm font-medium"
          />
          <button
            type="submit"
            disabled={isTyping}
            className="bg-primary hover:bg-primary-glow text-white p-4 rounded-2xl transition-all shadow-lg shadow-primary/30 flex items-center justify-center group active:scale-95"
          >
            <Send className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

const AdminView = ({ profile: initialProfile }: { profile: UserProfile | null }) => {
  const [adminStep, setAdminStep] = useState<'selection' | 'login' | 'dashboard'>(initialProfile ? 'dashboard' : 'selection');
  const [selectedUnitType, setSelectedUnitType] = useState<'sede' | 'local'>('sede');
  const [loginData, setLoginData] = useState({ user: '', pass: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(initialProfile);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  
  const [finances, setFinances] = useState<FinanceRecord[]>([]);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'frequency'>('list');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<UserProfile | null>(null);
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    email: '',
    role: 'member' as UserRole,
    unitId: 'sede',
    status: 'active' as 'active' | 'inactive'
  });

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setEditingMember(null);
    setMemberFormData({ name: '', email: '', role: 'member', unitId: adminProfile?.unitId || 'sede', status: 'active' });
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    
    try {
      if (editingMember) {
        await updateDoc(doc(db, 'users', editingMember.uid), {
          ...memberFormData,
        });
        addLog(`EDITOU MEMBRO: ${memberFormData.name.toUpperCase()}`);
      } else {
        const newMemberId = `member_${Date.now()}`;
        await addDoc(collection(db, 'users'), {
          ...memberFormData,
          uid: newMemberId,
          lastAccess: new Date().toISOString()
        });
        addLog(`CADASTROU NOVO MEMBRO: ${memberFormData.name.toUpperCase()}`);
      }
      closeMemberModal();
    } catch (err) {
      handleFirestoreError(err, editingMember ? OperationType.UPDATE : OperationType.CREATE, 'users');
    }
  };

  const openMemberModal = (m?: UserProfile) => {
    if (m) {
      setEditingMember(m);
      setMemberFormData({
        name: m.name,
        email: m.email,
        role: m.role,
        unitId: m.unitId,
        status: m.status as any
      });
    } else {
      setEditingMember(null);
      setMemberFormData({ name: '', email: '', role: 'member', unitId: adminProfile?.unitId || 'sede', status: 'active' });
    }
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = async (uid: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      addLog(`REMOVEU MEMBRO: ${name.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingFinance, setEditingFinance] = useState<FinanceRecord | null>(null);
  const [financeFormData, setFinanceFormData] = useState({
    description: '',
    amount: 0,
    type: 'offering' as FinanceRecord['type'],
    category: 'Geral',
    date: new Date().toISOString().split('T')[0]
  });

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    try {
      const dataToSave = {
        ...financeFormData,
        amount: Number(financeFormData.amount),
        unitId: adminProfile.unitId,
        date: new Date(financeFormData.date).toISOString()
      };

      if (editingFinance) {
        await updateDoc(doc(db, 'finances', editingFinance.id), dataToSave);
        addLog(`EDITOU LANÇAMENTO FINANCEIRO: ${financeFormData.description.toUpperCase()} (R$ ${financeFormData.amount})`);
      } else {
        await addDoc(collection(db, 'finances'), dataToSave);
        addLog(`NOVO LANÇAMENTO FINANCEIRO: ${financeFormData.description.toUpperCase()} (R$ ${financeFormData.amount})`);
      }
      
      setIsFinanceModalOpen(false);
      setEditingFinance(null);
      setFinanceFormData({ description: '', amount: 0, type: 'offering', category: 'Geral', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      handleFirestoreError(err, editingFinance ? OperationType.UPDATE : OperationType.CREATE, 'finances');
    }
  };

  const openFinanceModal = (f?: FinanceRecord) => {
    if (f) {
      setEditingFinance(f);
      setFinanceFormData({
        description: f.description,
        amount: f.amount,
        type: f.type,
        category: f.category || 'Geral',
        date: f.date.split('T')[0]
      });
    } else {
      setEditingFinance(null);
      setFinanceFormData({ description: '', amount: 0, type: 'offering', category: 'Geral', date: new Date().toISOString().split('T')[0] });
    }
    setIsFinanceModalOpen(true);
  };

  const handleDeleteFinance = async (id: string, description: string) => {
    try {
      await deleteDoc(doc(db, 'finances', id));
      addLog(`REMOVEU LANÇAMENTO FINANCEIRO: ${description.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `finances/${id}`);
    }
  };

  const handleUpdatePrayer = async (id: string, status: string, name: string) => {
    try {
      await updateDoc(doc(db, 'prayers', id), { status });
      addLog(`PEDIDO DE ORAÇÃO ATUALIZADO: ${name.toUpperCase()} -> ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `prayers/${id}`);
    }
  };

  const handleDeletePrayer = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'prayers', id));
      addLog(`PEDIDO DE ORAÇÃO REMOVIDO: ${name.toUpperCase()}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `prayers/${id}`);
    }
  };

  const addLog = async (action: string) => {
    if (!adminProfile) return;
    try {
      await addDoc(collection(db, 'admin_logs'), {
        user: adminProfile.name,
        role: adminProfile.role,
        action,
        date: new Date().toISOString(),
        unitId: adminProfile.unitId
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (adminStep === 'dashboard' && adminProfile) {
      // Existing queries...
      const logQ = query(collection(db, 'admin_logs'), orderBy('date', 'desc'), limit(25));
      const unsubLogs = onSnapshot(logQ, (s) => setLogs(s.docs.map(d => ({id: d.id, ...d.data()}))), (error) => handleFirestoreError(error, OperationType.LIST, 'admin_logs'));
      return () => unsubLogs();
    }
  }, [adminStep, adminProfile]);

  // ... rest of the code updated to include the new tab and presence logic ...

  const ADMIN_CREDENTIALS = {
    'pastorpresidente': { pass: 'pastorpresidentedpvip123', role: 'admin_sede', unit: 'sede', name: 'Pr. Presidente' },
    'secretario': { pass: 'secretariodpvip123', role: 'secretary_sede', unit: 'sede', name: 'Secretário Sede' },
    'tesoureiro': { pass: 'tesoureiropvip123', role: 'treasurer_sede', unit: 'sede', name: 'Tesoureiro Sede' },
    'pastordp': { pass: 'pastordp123', role: 'pastor_local', unit: 'jaboticabal', name: 'Pr. Local' },
    'secretariodp': { pass: 'secretariodp123', role: 'secretary_local', unit: 'jaboticabal', name: 'Secretário Local' },
    'tesoureirop': { pass: 'tesoureirop123', role: 'treasurer_local', unit: 'jaboticabal', name: 'Tesoureiro Local' },
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const normalizedUser = loginData.user.replace(/\s+/g, '').toLowerCase();
    const cred = ADMIN_CREDENTIALS[normalizedUser as keyof typeof ADMIN_CREDENTIALS];
    
    if (cred && cred.pass === loginData.pass.trim()) {
      const profile: UserProfile = {
        uid: normalizedUser,
        name: cred.name,
        email: `${normalizedUser}@adbompastor.com`,
        role: cred.role as UserRole,
        unitId: cred.unit,
        status: 'active',
        lastAccess: new Date().toISOString()
      };
      setAdminProfile(profile);
      setAdminStep('dashboard');
      addDoc(collection(db, 'admin_logs'), {
        user: profile.name,
        role: profile.role,
        action: 'ACESSOU SISTEMA RESTRITO',
        date: new Date().toISOString(),
        unitId: profile.unitId
      });
      if (profile.role.includes('treasurer')) setActiveTab('finances');
      else if (profile.role.includes('secretary')) setActiveTab('members');
      else setActiveTab('overview');
    } else {
      setLoginError('Usuário ou senha incorretos! Verifique letra maiúscula e espaços.');
    }
  };

  useEffect(() => {
    if (adminStep === 'dashboard' && adminProfile) {
      let financeQ = query(collection(db, 'finances'), orderBy('date', 'desc'), limit(50));
      let memberQ = query(collection(db, 'users'), limit(50));
      let prayerQ = query(collection(db, 'prayers'), orderBy('date', 'desc'), limit(50));

      if (!adminProfile.role.includes('sede')) {
        financeQ = query(collection(db, 'finances'), where('unitId', '==', adminProfile.unitId), orderBy('date', 'desc'), limit(50));
        memberQ = query(collection(db, 'users'), where('unitId', '==', adminProfile.unitId), limit(50));
      } else if (selectedUnit !== 'all') {
        financeQ = query(collection(db, 'finances'), where('unitId', '==', selectedUnit), orderBy('date', 'desc'), limit(50));
        memberQ = query(collection(db, 'users'), where('unitId', '==', selectedUnit), limit(50));
      }

      const unsubFin = onSnapshot(financeQ, (s) => setFinances(s.docs.map(d => ({id: d.id, ...d.data()} as FinanceRecord))), (error) => handleFirestoreError(error, OperationType.LIST, 'finances'));
      const unsubMem = onSnapshot(memberQ, (s) => setMembers(s.docs.map(d => ({uid: d.id, ...d.data()} as UserProfile))), (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
      const unsubPr = onSnapshot(prayerQ, (s) => setPrayers(s.docs.map(d => ({id: d.id, ...d.data()} as PrayerRequest))), (error) => handleFirestoreError(error, OperationType.LIST, 'prayers'));

      return () => { unsubFin(); unsubMem(); unsubPr(); };
    }
  }, [adminStep, adminProfile, selectedUnit]);

  if (adminStep === 'selection') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { id: 'sede', title: '🏢 ACESSO SEDE', location: 'Guariba', icon: Shield },
            { id: 'local', title: '⛪ ACESSO CONGREGAÇÃO', location: 'Jaboticabal', icon: Home }
          ].map(opt => (
            <motion.div
              key={opt.id}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] flex flex-col items-center text-center space-y-6 backdrop-blur-xl group cursor-pointer"
              onClick={() => { setSelectedUnitType(opt.id as any); setAdminStep('login'); }}
            >
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all shadow-2xl">
                <opt.icon size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black italic tracking-tighter">{opt.title}</h3>
                <p className="text-primary font-bold tracking-[0.3em] uppercase text-[10px] mt-2">{opt.location}</p>
              </div>
              <button className="bg-white/5 border border-white/10 hover:bg-white/10 px-10 py-4 rounded-2xl text-sm font-black uppercase transition-all">
                Entrar
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (adminStep === 'login') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#0a0a0a] border border-white/10 p-12 rounded-[2.5rem] shadow-2xl"
        >
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">Login {selectedUnitType.toUpperCase()}</h2>
            <button onClick={() => setAdminStep('selection')} className="text-white/40 hover:text-white transition-all">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase p-4 rounded-xl tracking-widest"
              >
                {loginError}
              </motion.div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Usuário</label>
              <input 
                type="text" 
                value={loginData.user}
                onChange={(e) => setLoginData({...loginData, user: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold"
                placeholder="Insira seu login..."
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Senha</label>
              <input 
                type="password" 
                value={loginData.pass}
                onChange={(e) => setLoginData({...loginData, pass: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="w-full bg-primary hover:bg-primary-glow text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all active:scale-95">
              Confirmar Acesso
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const isSede = adminProfile?.role.includes('sede');
  const role = adminProfile?.role || '';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-10 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-10">
        <div>
          <div className="flex items-center gap-3 text-primary mb-3">
            <Lock size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Painel de Controle Restrito</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase">Painel <span className="text-primary italic">{isSede ? 'Master' : 'Local'}</span></h2>
          <div className="flex items-center gap-3 mt-4">
            <div className="px-3 py-1 bg-white/10 rounded-md text-[10px] font-black uppercase tracking-widest text-primary">
              {adminProfile?.name} • {role.replace('_', ' ')}
            </div>
            <button onClick={() => { setAdminStep('selection'); setAdminProfile(null); }} className="text-white/40 hover:text-red-500 transition-all font-black text-[10px] uppercase">Sair</button>
          </div>
        </div>

        {isSede && (
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Contexto Global</label>
             <select 
               value={selectedUnit}
               onChange={(e) => setSelectedUnit(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none transition-all hover:bg-white/10"
             >
               <option value="all" className="bg-black">🌍 Consolidado (Tudo)</option>
               <option value="sede" className="bg-black">🏢 Guariba (Sede)</option>
               <option value="jaboticabal" className="bg-black">⛪ Jaboticabal</option>
             </select>
          </div>
        )}
      </div>

      <div className="flex gap-4 p-1 bg-white/5 rounded-2xl w-fit">
        {[
          { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, access: ['admin_sede', 'pastor_local'] },
          { id: 'finances', label: 'Financeiro', icon: DollarSign, access: ['admin_sede', 'pastor_local', 'treasurer_sede', 'treasurer_local'] },
          { id: 'members', label: 'Membros', icon: Users, access: ['admin_sede', 'pastor_local', 'secretary_sede', 'secretary_local'] },
          { id: 'prayers', label: 'Clamor', icon: Heart, access: ['admin_sede', 'pastor_local'] },
          { id: 'logs', label: 'Auditoria', icon: Shield, access: ['admin_sede'] },
        ].filter(t => t.access.includes(role)).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl text-xs font-black transition-all ${
              activeTab === tab.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-white/40 hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="min-h-[400px]"
        >
          {activeTab === 'overview' && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Total Membros', value: members.length, trend: '+5%', icon: Users, color: 'text-blue-500' },
                  { label: 'Saldo Geral', value: `R$ ${(finances.filter(f => f.type !== 'expense').reduce((acc, f) => acc + f.amount, 0) - finances.filter(f => f.type === 'expense').reduce((acc, f) => acc + f.amount, 0)).toLocaleString()}`, trend: 'Positivo', icon: DollarSign, color: 'text-green-500' },
                  { label: 'Pedidos Ativos', value: prayers.length, trend: 'Monitorado', icon: Heart, color: 'text-red-500' }
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/[0.08] transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl bg-white/5 group-hover:bg-primary transition-all group-hover:text-black`}>
                        <s.icon size={28} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{s.trend}</span>
                    </div>
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em] mb-1">{s.label}</p>
                    <p className="text-4xl font-black italic tracking-tighter">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-black/40 border border-white/10 p-12 rounded-[3rem] relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] pointer-events-none" />
                 <h4 className="text-xl font-black italic tracking-tighter mb-10 flex items-center gap-3">
                   <TrendingUp className="text-primary" /> INDICADORES DE CRESCIMENTO
                 </h4>
                 <div className="h-48 flex items-end gap-3 px-4">
                   {[40, 60, 45, 90, 65, 85, 100, 75, 95, 80, 50, 90].map((h, i) => (
                     <motion.div
                       key={i}
                       initial={{ height: 0 }}
                       animate={{ height: `${h}%` }}
                       className="flex-1 bg-primary/20 rounded-t-lg relative group/bar"
                     >
                       <div className="absolute inset-0 bg-primary opacity-20 group-hover/bar:opacity-100 transition-opacity" />
                     </motion.div>
                   ))}
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                   <div className="bg-white/5 p-6 rounded-2xl space-y-4">
                     <h5 className="text-xs font-black uppercase text-red-500 flex items-center gap-2 tracking-widest"><Bell size={14} /> ALERTAS CRÍTICOS</h5>
                     <p className="text-sm font-bold text-white/60">⚠️ 12 membros não frequentam há mais de 30 dias.</p>
                     <p className="text-sm font-bold text-white/60">📉 Queda de 15% nas ofertas em {selectedUnit === 'all' ? 'Diferentes Congregações' : selectedUnit}.</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-2xl space-y-4">
                     <h5 className="text-xs font-black uppercase text-green-500 flex items-center gap-2 tracking-widest"><TrendingUp size={14} /> OPORTUNIDADES</h5>
                     <p className="text-sm font-bold text-white/60">🚀 Batismo de 8 novos membros agendado.</p>
                     <p className="text-sm font-bold text-white/60">📅 Congresso regional no próximo mês.</p>
                   </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-black italic tracking-tight uppercase">Controladoria Financeira</h3>
                <button onClick={() => openFinanceModal()} className="bg-primary hover:bg-primary-glow text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/30 transition-all flex items-center gap-2">
                  <Plus size={16} /> Novo Lançamento
                </button>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Natureza</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Descrição</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Unidade</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Data</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Valor</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-bold">
                    {finances.map(f => (
                      <tr key={f.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="px-8 py-6">
                          <span className={`${f.type === 'expense' ? 'text-red-500' : 'text-green-500'} text-[10px] font-black uppercase`}>
                            {f.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm">{f.description}</td>
                        <td className="px-8 py-6 text-[10px] uppercase opacity-40">{f.unitId}</td>
                        <td className="px-8 py-6 text-xs text-white/40 uppercase">{f.date}</td>
                        <td className={`px-8 py-6 text-right font-black italic ${f.type === 'expense' ? 'text-red-500 text-lg' : 'text-green-500 text-lg'}`}>
                          {f.type === 'expense' ? '-' : '+'} R$ {f.amount.toLocaleString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => openFinanceModal(f)} className="text-[10px] font-black uppercase text-primary hover:text-white transition-all bg-primary/10 hover:bg-primary px-4 py-2 rounded-lg border border-primary/20">Editar</button>
                            <button onClick={() => handleDeleteFinance(f.id, f.description)} className="text-[10px] font-black uppercase text-red-500 hover:text-white transition-all bg-red-500/10 hover:bg-red-500 px-4 py-2 rounded-lg border border-red-500/20">Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <h3 className="text-3xl font-black italic tracking-tight uppercase">Membros</h3>
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    <button 
                      onClick={() => setActiveSubTab('list')}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeSubTab === 'list' ? 'bg-primary' : 'text-white/40'}`}
                    >
                      Planilha
                    </button>
                    <button 
                      onClick={() => setActiveSubTab('frequency')}
                      className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeSubTab === 'frequency' ? 'bg-primary' : 'text-white/40'}`}
                    >
                      Frequência
                    </button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <input type="text" placeholder="BUSCAR NOME..." className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary w-64 uppercase font-bold" />
                  <button onClick={() => openMemberModal()} className="bg-primary px-6 py-3 rounded-xl text-xs font-black uppercase">Novo Registro</button>
                </div>
              </div>

              {activeSubTab === 'list' ? (
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Identificação</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Igreja</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(m => (
                        <tr key={m.uid} className="border-b border-white/5 hover:bg-white/[0.03] transition-all">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black text-xs uppercase">{m.name[0]}</div>
                              <div>
                                <p className="font-black italic text-sm">{m.name.toUpperCase()}</p>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest">{m.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-[10px] uppercase font-bold text-white/40">{m.unitId}</td>
                          <td className="px-8 py-6">
                            <div className={`w-2 h-2 rounded-full ${m.status === 'active' ? 'bg-green-500' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'}`} />
                          </td>
                          <td className="px-8 py-6 text-right space-x-2">
                            <button onClick={() => openMemberModal(m)} className="text-[9px] font-black uppercase text-primary hover:text-white transition-all bg-primary/5 px-2 py-1 rounded">Editar</button>
                            <button onClick={() => handleDeleteMember(m.uid, m.name)} className="text-[9px] font-black uppercase text-red-500 hover:text-white transition-all bg-red-500/5 px-2 py-1 rounded">Remover</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map(m => (
                    <div key={m.uid} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-black">{m.name[0]}</div>
                        <div>
                          <p className="font-black italic text-sm">{m.name.toUpperCase()}</p>
                          <p className="text-[10px] text-white/40 uppercase font-black">Presente ontem?</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => addLog(`MARCOU PRESENÇA: ${m.name.toUpperCase()}`)}
                        className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-primary transition-all"
                      >
                        Marcar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-8">
              <h3 className="text-3xl font-black italic tracking-tight uppercase">Log de Auditoria</h3>
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Usuário</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Ação Realizada</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40">Data/Hora</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-all">
                        <td className="px-8 py-6">
                          <p className="font-black italic text-xs tracking-tight">{log.user}</p>
                          <p className="text-[9px] text-white/30 uppercase tracking-widest">{log.role}</p>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-primary italic uppercase">{log.action}</td>
                        <td className="px-8 py-6 text-[10px] text-white/40 font-black uppercase">{new Date(log.date).toLocaleString()}</td>
                        <td className="px-8 py-6 text-right font-mono text-[10px] opacity-20">192.168.1.{Math.floor(Math.random() * 255)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'prayers' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {prayers.map(p => (
                 <div key={p.id} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] relative group hover:bg-white/[0.1] transition-all">
                   <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                   <div className="flex justify-between items-start mb-6">
                      <Heart className="text-primary" />
                      <span className="text-[9px] font-black uppercase px-2 py-1 bg-white/10 rounded tracking-[0.2em]">{p.status}</span>
                   </div>
                   <h5 className="font-black italic text-sm uppercase mb-2">{p.name || 'Anônimo'}</h5>
                   <p className="text-sm text-white/60 leading-relaxed h-24 overflow-y-auto no-scrollbar font-bold">"{p.request}"</p>
                   <div className="mt-8 flex gap-2">
                     <button onClick={() => handleUpdatePrayer(p.id, 'Atendido', p.name)} className="flex-1 bg-primary text-white text-[9px] font-black uppercase py-2 rounded-lg transition-all">Atendido</button>
                     <button onClick={() => handleDeletePrayer(p.id, p.name)} className="flex-1 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-[9px] font-black uppercase py-2 rounded-lg border border-white/5 transition-all">Remover</button>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMemberModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                  {editingMember ? 'Editar Registro' : 'Novo Membro'}
                </h3>
                <button onClick={closeMemberModal} className="text-white/40 hover:text-white transition-all">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSaveMember} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Nome Completo</label>
                    <input 
                      type="text" 
                      value={memberFormData.name}
                      onChange={(e) => setMemberFormData({...memberFormData, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold"
                      placeholder="NOME DO MEMBRO"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Cargo/Função</label>
                        <select 
                          value={memberFormData.role}
                          onChange={(e) => setMemberFormData({...memberFormData, role: e.target.value as UserRole})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold uppercase text-xs"
                        >
                          <option value="member" className="bg-black">Membro</option>
                          <option value="deacon" className="bg-black">Diácono</option>
                          <option value="presbyter" className="bg-black">Presbítero</option>
                          <option value="evangelist" className="bg-black">Evangelista</option>
                          <option value="pastor_local" className="bg-black">Pastor Local</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Status</label>
                        <select 
                          value={memberFormData.status}
                          onChange={(e) => setMemberFormData({...memberFormData, status: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold uppercase text-xs"
                        >
                          <option value="active" className="bg-black">Ativo</option>
                          <option value="inactive" className="bg-black">Inativo/Afastado</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Igreja/Congregação</label>
                    <select 
                      value={memberFormData.unitId}
                      onChange={(e) => setMemberFormData({...memberFormData, unitId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold uppercase text-xs"
                    >
                      <option value="sede" className="bg-black">Guariba (Sede)</option>
                      <option value="jaboticabal" className="bg-black">Jaboticabal</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-primary hover:bg-primary-glow text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all active:scale-95">
                    {editingMember ? 'Atualizar Dados' : 'Finalizar Cadastro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFinanceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFinanceModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[60px] pointer-events-none" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase">{editingFinance ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                <button onClick={() => setIsFinanceModalOpen(false)} className="text-white/40 hover:text-white transition-all">
                  <X />
                </button>
              </div>

              <form onSubmit={handleSaveFinance} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Descrição</label>
                    <input 
                      type="text" 
                      value={financeFormData.description}
                      onChange={(e) => setFinanceFormData({...financeFormData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold"
                      placeholder="EX: OFERTAS CULTO DOMINGO"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Valor (R$)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={financeFormData.amount}
                          onChange={(e) => setFinanceFormData({...financeFormData, amount: Number(e.target.value)})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold"
                          required
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Data</label>
                        <input 
                          type="date" 
                          value={financeFormData.date}
                          onChange={(e) => setFinanceFormData({...financeFormData, date: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold text-xs"
                          required
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Tipo de Entrada</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['offering', 'tithe', 'expense'].map((t) => (
                         <button
                           key={t}
                           type="button"
                           onClick={() => setFinanceFormData({...financeFormData, type: t as any})}
                           className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                             financeFormData.type === t 
                               ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                               : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                           }`}
                         >
                           {t === 'offering' ? 'Oferta' : t === 'tithe' ? 'Dízimo' : 'Despesa'}
                         </button>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-primary hover:bg-primary-glow text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all active:scale-95">
                    {editingFinance ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (u) {
        unsubProfile = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) {
            setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          } else {
            setProfile({
              uid: u.uid,
              name: u.displayName || 'Membro',
              email: u.email || '',
              role: 'member',
              unitId: 'sede',
              status: 'active',
              lastAccess: new Date().toISOString()
            });
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${u.uid}`));
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
    });

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => signOut(auth);

  if (!isAuthReady) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-8">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-[0_0_30px_rgba(0,136,255,0.5)] bg-white p-2"
        >
          <img src="https://lh3.googleusercontent.com/d/1EZxEDe93F2ZCtDGrBXXhVIhmWAN5xZyo" alt="Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
        </motion.div>
        <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-full bg-primary shadow-[0_0_15px_#0088FF]"
          />
        </div>
      </div>
    );
  }

  const navigateToVideo = (id: string) => {
    const video = [...LIVES, ...MOVIES].find(v => v.id === id);
    setSelectedVideo(video);
  };

  return (
    <div className="min-h-screen bg-netflix-black text-white font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-700 px-4 md:px-12 py-3 md:py-4 flex items-center justify-between ${isScrolled ? 'bg-black/95 backdrop-blur-3xl border-b border-white/5 shadow-2xl' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-4 md:gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setActiveView('home')}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/40 group-hover:border-primary transition-all shadow-[0_0_20px_rgba(0,136,255,0.3)] bg-white p-1.5 ring-4 ring-black relative">
              <img src="https://lh3.googleusercontent.com/d/1EZxEDe93F2ZCtDGrBXXhVIhmWAN5xZyo" alt="AD Bom Pastor Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
            </div>
            <div className="relative">
              <div className="absolute -inset-x-8 -inset-y-4 opacity-5 pointer-events-none overflow-hidden select-none">
                <img src="https://lh3.googleusercontent.com/d/1EZxEDe93F2ZCtDGrBXXhVIhmWAN5xZyo" className="w-32 h-32 object-contain grayscale brightness-200" alt="" referrerPolicy="no-referrer" />
              </div>
              <h1 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase whitespace-nowrap relative z-10">
                AD BOM <span className="text-primary">PASTOR</span>
              </h1>
            </div>
          </motion.div>
          <div className="hidden lg:flex items-center gap-8">
            {[
              { id: 'home', label: 'Início', icon: <Home size={18} /> },
              { id: 'lives', label: 'Programação', icon: <Video size={18} /> },
              { id: 'mentor', label: 'Mentor IA', icon: <BrainCircuit size={18} /> },
              { id: 'admin', label: 'Restrito', icon: <Lock size={18} /> },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveView(link.id)}
                className={`flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-all hover:text-primary ${activeView === link.id ? 'text-primary' : 'text-white/60'}`}
              >
                {link.label}
                {activeView === link.id && <motion.div layoutId="nav-underline" className="h-0.5 w-full bg-primary absolute -bottom-1" />}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-all group">
            <Search size={18} className="text-white/40 group-hover:text-primary transition-colors" />
            <input placeholder="Buscar mensagens..." className="bg-transparent border-none outline-none text-xs ml-3 w-40 font-bold" />
          </div>
          <Bell className="cursor-pointer hover:text-primary transition-colors hidden md:block" />
          {user ? (
            <div className="flex items-center gap-4 border-l border-white/10 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase tracking-tighter">{(profile?.name || '').split(' ')[0]}</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest opacity-80">{profile?.role?.replace('_', ' ')}</p>
              </div>
              <motion.div 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center cursor-pointer shadow-lg shadow-primary/30 border border-white/20 overflow-hidden"
                onClick={() => setActiveView('profile')}
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User size={20} />
                )}
              </motion.div>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-primary hover:bg-primary-glow px-6 py-2.5 rounded-xl font-black text-sm transition-all shadow-xl shadow-primary/20 flex items-center gap-2 active:scale-95 uppercase tracking-widest">
              ENTRAR
            </button>
          )}
          <Menu className="lg:hidden cursor-pointer" onClick={() => setMobileMenuOpen(true)} />
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[100] bg-black p-12 lg:hidden flex flex-col gap-12"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary bg-white p-1 shadow-[0_0_15px_rgba(0,136,255,0.4)]">
                  <img src="https://lh3.googleusercontent.com/d/1EZxEDe93F2ZCtDGrBXXhVIhmWAN5xZyo" alt="AD Bom Pastor Logo" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
                </div>
                <h2 className="text-primary font-black italic text-xl tracking-tighter uppercase">AD BOM PASTOR</h2>
              </div>
              <X onClick={() => setMobileMenuOpen(false)} className="text-white/50 hover:text-white" />
            </div>
            <div className="flex flex-col gap-8">
               {['home', 'lives', 'mentor', 'admin'].map(view => (
                 <button 
                  key={view}
                  onClick={() => { setActiveView(view); setMobileMenuOpen(false); }}
                  className={`text-4xl font-black italic tracking-tighter text-left ${activeView === view ? 'text-primary' : 'text-white/40'}`}
                 >
                   {view.toUpperCase()}
                 </button>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-0">
        <AnimatePresence mode="wait">
          {activeView === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Hero Section */}
              <div className="relative h-screen w-full">
                <div className="absolute inset-0">
                  <img 
                    src={LIVES[0].thumbnail} 
                    className="w-full h-full object-cover" 
                    alt="Hero"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-[60vh] bg-gradient-to-t from-netflix-black via-netflix-black/60 to-transparent" />
                </div>
                
                <div className="relative h-full flex flex-col justify-center px-4 md:px-12 pt-20 max-w-4xl space-y-8 z-10">
                  <div className="absolute -left-20 md:-left-40 top-1/2 -translate-y-1/2 opacity-[0.03] md:opacity-[0.05] pointer-events-none select-none blur-sm hidden sm:block">
                    <img src="https://lh3.googleusercontent.com/d/1EZxEDe93F2ZCtDGrBXXhVIhmWAN5xZyo" className="w-[600px] md:w-[1000px] h-auto object-contain grayscale brightness-200" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-4"
                  >
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-red-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> AO VIVO
              </div>
              <span className="text-primary font-black uppercase tracking-widest text-xs">Assembleia de Deus Bom Pastor - Guariba/SP</span>
            </div>
                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight italic text-shadow-strong uppercase">BEM-VINDO À PLATAFORMA <br/><span className="text-primary text-shadow-glow">AD BOM PASTOR</span></h1>
                    <p className="text-netflix-gray text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                      Louvor, adoração e uma palavra profética. Uma plataforma que transforma vidas!
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6 pt-6"
                  >
                    <button 
                      onClick={() => navigateToVideo(LIVES[0].id)}
                      className="bg-white text-black hover:bg-white/90 px-10 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-white/40 group w-full sm:w-auto z-20"
                    >
                      <Play fill="black" size={24} className="group-hover:scale-110 transition-transform" /> ASSISTIR AGORA
                    </button>
                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-3xl border border-white/10 px-10 py-4 rounded-xl font-black text-lg flex items-center justify-center gap-4 transition-all w-full sm:w-auto z-20">
                      <Info size={24} /> MAIS INFORMAÇÕES
                    </button>
                  </motion.div>
                </div>
              </div>

              <div className="relative z-10 pt-12 space-y-12 pb-32">
                <VideoRow title="🔥 EM DESTAQUE - AO VIVO" videos={LIVES.slice(0, 10)} onVideoClick={navigateToVideo} delay={1.0} />
                <VideoRow title="📚 CULTOS DE ENSINO" videos={LIVES.filter(v => v.category === 'Ensino')} onVideoClick={navigateToVideo} delay={1.2} />
                <VideoRow title="🙏 ÚLTIMAS PROGRAMAÇÕES" videos={LIVES.slice(10)} onVideoClick={navigateToVideo} delay={1.4} />
              </div>
            </motion.div>
          )}

          {activeView === 'mentor' && (
            <motion.div 
              key="mentor" 
              initial={{ opacity: 0, y: 50 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-4 md:px-12 pt-32 pb-40"
            >
              <div className="mb-12">
                <h2 className="text-5xl font-black italic tracking-tighter">MENTOR <span className="text-primary">IA</span></h2>
                <p className="text-netflix-gray font-bold tracking-[0.3em] uppercase text-xs mt-2">Suporte Ministerial 24/7 com Inteligência Artificial</p>
              </div>
              <MentorChat />
            </motion.div>
          )}

          {activeView === 'profile' && profile && (
            <motion.div 
              key="profile" 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="px-4 md:px-12 pt-32 pb-40 max-w-4xl mx-auto"
            >
              <ProfileView 
                profile={profile} 
                onUpdate={(updated) => setProfile(updated)} 
                onNavigateAdmin={() => setActiveView('admin')}
              />
            </motion.div>
          )}

          {activeView === 'admin' && (
            <motion.div 
              key="admin" 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }}
              className="px-4 md:px-12 pt-32 pb-40"
            >
              <AdminView profile={profile} />
            </motion.div>
          )}

          {activeView === 'lives' && (
            <motion.div 
              key="lives" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="px-4 md:px-12 pt-32 pb-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {[...LIVES, ...LIVES].map((video, idx) => (
                <motion.div
                  key={`${video.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -10 }}
                  className="bg-white/5 rounded-3xl overflow-hidden border border-white/5 group shadow-2xl transition-all hover:shadow-primary/20"
                  onClick={() => navigateToVideo(video.id)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={video.title} referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-4 right-4 bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{video.duration}</div>
                  </div>
                  <div className="p-6 space-y-3">
                    <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{video.category}</p>
                    <h4 className="font-black text-sm tracking-tight line-clamp-2 leading-tight">{video.title}</h4>
                    <div className="flex items-center gap-4 text-[10px] text-netflix-gray font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1"><TrendingUp size={12} className="text-primary"/> {video.views} Assistindo</span>
                      <span className="flex items-center gap-1"><Clock size={12}/> Ontem</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Video Modal Player */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setSelectedVideo(null)} />
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,136,255,0.3)] border border-white/10"
            >
              <iframe 
                src={`https://www.youtube.com/embed/${selectedVideo.id}?autoplay=1`}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              
              <div className="absolute top-0 w-full p-8 md:p-12 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <p className="text-primary font-black uppercase tracking-[0.3em] text-xs mb-2">{selectedVideo.category}</p>
                    <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter">{selectedVideo.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="pointer-events-auto bg-white/10 hover:bg-white/20 p-4 rounded-2xl backdrop-blur-xl border border-white/10 transition-all active:scale-95"
                >
                  <X />
                </button>
              </div>

              <div className="absolute bottom-0 w-full p-8 md:p-12 pointer-events-none">
                <div className="flex items-center gap-6 pointer-events-auto">
                  <div className="h-2 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "35%" }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <span className="text-xs font-black tracking-widest text-primary">LIVE NOW</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Prayer Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setActiveView('prayers')}
        className="fixed bottom-8 right-8 z-[60] bg-primary text-white p-6 rounded-3xl shadow-2xl shadow-primary/40 flex items-center gap-3 group transition-all"
      >
        <Heart fill="white" className="group-hover:scale-125 transition-transform" />
        <span className="font-black text-sm tracking-widest hidden md:block">PEDIR ORAÇÃO</span>
      </motion.button>

      {/* Prayer Request Modal (Simple Overlay) */}
      <AnimatePresence>
        {activeView === 'prayers' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl p-8 flex items-center justify-center"
          >
            <div className="max-w-xl w-full space-y-8">
               <div className="text-center space-y-4 mb-12">
                  <Heart className="mx-auto text-primary" size={64} fill="currentColor" />
                  <h2 className="text-5xl font-black italic tracking-tighter">CENTRAL DE <span className="text-primary">ORAÇÃO</span></h2>
                  <p className="text-netflix-gray font-bold">Coloque o seu pedido no Altar. Nossos intercessores estarão clamando por você.</p>
               </div>
               <PrayerForm onBack={() => setActiveView('home')} />
            </div>
            <button 
              onClick={() => setActiveView('home')}
              className="absolute top-12 right-12 text-white/40 hover:text-white transition-all"
            >
              <X size={32} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrayerForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'prayers'), {
        name,
        request,
        date: new Date().toISOString(),
        status: 'pending'
      });
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/10 border border-primary/30 p-12 rounded-[40px] text-center space-y-6 backdrop-blur-2xl">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/50">
          <Heart fill="white" size={40} />
        </div>
        <h3 className="text-3xl font-black italic">CLAMOR RECEBIDO!</h3>
        <p className="text-netflix-gray text-lg">Seu pedido foi depositado no altar virtual. Creia na vitória!</p>
        <button onClick={onBack} className="text-primary font-black uppercase tracking-widest text-sm hover:underline">Voltar ao Início</button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input 
        placeholder="Seu nome (opcional)" 
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/5 border border-white/10 h-16 px-8 rounded-2xl outline-none focus:border-primary transition-all text-lg"
      />
      <textarea 
        placeholder="Conte-nos o seu pedido de oração..." 
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        className="w-full bg-white/5 border border-white/10 min-h-[200px] p-8 rounded-2xl outline-none focus:border-primary transition-all text-lg no-scrollbar"
        required
      />
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-primary hover:bg-primary-glow h-20 rounded-2xl font-black text-xl tracking-widest shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-4 group active:scale-95"
      >
        {isSubmitting ? 'ENVIANDO...' : 'DEPOSITAR NO ALTAR'}
        <Send className="group-hover:translate-x-2 transition-transform" />
      </button>
    </form>
  );
}

function ProfileView({ profile, onUpdate, onNavigateAdmin }: { profile: UserProfile, onUpdate: (p: UserProfile) => void, onNavigateAdmin: () => void }) {
  const [name, setName] = useState(profile.name);
  const [photoURL, setPhotoURL] = useState(profile.photoURL || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        name,
        photoURL
      });
      onUpdate({ ...profile, name, photoURL });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative group">
          <div className="w-32 h-32 rounded-[2.5rem] bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all shadow-2xl shadow-primary/20">
            {photoURL ? (
              <img src={photoURL} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User size={48} className="text-primary" />
            )}
          </div>
          {isEditing && (
            <div className="absolute -bottom-2 -right-2 bg-primary p-3 rounded-2xl shadow-xl text-white">
              <Camera size={20} />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase">{profile.name}</h2>
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mt-2">{profile.role.replace('_', ' ')} • {profile.unitId.toUpperCase()}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] pointer-events-none" />
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black italic tracking-tighter uppercase">Informações da Conta</h3>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="text-xs font-black uppercase text-primary hover:underline tracking-widest"
            >
              Editar Perfil
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Nome Completo</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">URL da Foto</label>
              <input 
                type="text" 
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-primary transition-all font-bold"
                placeholder="https://..."
              />
              <p className="text-[9px] text-white/30 ml-2 uppercase font-bold italic tracking-widest">Cole o link da sua imagem preferida aqui.</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                {isSaving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
              >
                CANCELAR
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Email de Acesso</p>
              <p className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white/30 select-none">{profile.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-2">Status do Cadastro</p>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                <p className="font-bold uppercase text-xs tracking-widest">{profile.status === 'active' ? 'Ativo e Regular' : 'Aguardando Aprovação'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {(profile.role.includes('admin') || profile.role.includes('secretary') || profile.role.includes('treasurer') || profile.role === 'pastor_local') && (
          <button 
            onClick={onNavigateAdmin}
            className="flex-1 bg-white/5 border border-white/10 py-8 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-primary hover:text-black transition-all group font-black uppercase tracking-tighter"
          >
            <Shield size={24} className="group-hover:rotate-12 transition-transform" />
            Ir para Painel Administrativo
          </button>
        )}
        <button 
          onClick={() => signOut(auth)}
          className="flex-1 bg-red-500/5 border border-red-500/10 py-8 rounded-[2rem] flex items-center justify-center gap-4 hover:bg-red-500 text-red-500 hover:text-white transition-all group font-black uppercase tracking-tighter"
        >
          <LogOut size={24} className="group-hover:-translate-x-2 transition-transform" />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
