import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertTriangle, Loader2, X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Select from '../ui/Select';
import api from '../../services/api';
import { parseOfxText } from '../../utils/ofxClientParser';
import { saveLocalTransaction, getCategorizationRules, getCachedCategories, cacheCategories } from '../../services/db';
import { syncOfflineTransactions } from '../../services/syncService';
import { useToast } from '../../hooks/useToast';

function ImportModal({ isOpen, onClose, accounts, categories, fetchCategories, fetchAccounts, onSuccess, isLocalMode }) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [fileType, setFileType] = useState(''); // 'excel' or 'ofx'
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    // Progress States
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [currentStepText, setCurrentStepText] = useState('');
    const [uploadedBytes, setUploadedBytes] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);

    if (!isOpen) return null;

    const handleFileSelect = (selectedFile) => {
        if (!selectedFile) return;
        
        const extension = selectedFile.name.split('.').pop().toLowerCase();
        if (extension === 'xlsx' || extension === 'xls') {
            if (isLocalMode) {
                addToast({ type: 'error', title: t('common.error'), message: 'A importação de Excel não está disponível no Modo Local.' });
                return;
            }
            setFile(selectedFile);
            setFileType('excel');
        } else if (extension === 'ofx') {
            setFile(selectedFile);
            setFileType('ofx');
        } else {
            addToast({ type: 'error', title: t('common.error'), message: 'Formato de arquivo não suportado. Use .xlsx, .xls ou .ofx.' });
        }
    };

    const handleRemoveFile = () => {
        if (uploading) return;
        setFile(null);
        setFileType('');
        setSelectedAccountId('');
        setUploadProgress(0);
        setCurrentStepText('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (uploading) return;
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (uploading) return;
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleClose = () => {
        if (uploading) return;
        setFile(null);
        setFileType('');
        setSelectedAccountId('');
        setUploadProgress(0);
        setCurrentStepText('');
        onClose();
    };

    const startImport = async () => {
        if (!file) return;

        if (fileType === 'ofx' && !selectedAccountId) {
            addToast({ type: 'error', title: t('common.error'), message: 'Selecione uma conta bancária para vincular as transações.' });
            return;
        }

        setUploading(true);

        if (fileType === 'excel') {
            const formData = new FormData();
            formData.append('file', file);

            try {
                setUploadProgress(0);
                setCurrentStepText("Enviando arquivo para o servidor...");
                
                await api.post('/transactions/import', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                        setUploadedBytes(progressEvent.loaded);
                        setTotalBytes(progressEvent.total);
                        if (percentCompleted === 100) {
                            setCurrentStepText("Processando dados e atualizando saldos (Aguarde...)");
                        }
                    }
                });

                addToast({ type: 'success', title: t('common.import'), message: t('transactions.importSuccess') });
                onSuccess();
                fetchCategories();
                fetchAccounts();
                handleClose();
            } catch (error) {
                console.error(error);
                addToast({ type: 'error', title: t('common.error'), message: t('transactions.importError') });
                setUploading(false);
            }
        } else if (fileType === 'ofx') {
            const account = accounts.find(a => String(a.id) === String(selectedAccountId));
            if (!account) {
                addToast({ type: 'error', title: t('common.error'), message: 'Conta selecionada não encontrada.' });
                setUploading(false);
                return;
            }

            const customRules = await getCategorizationRules().catch(() => []);

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const text = event.target.result;
                    const parsedTransactions = parseOfxText(text);
                    if (parsedTransactions.length === 0) {
                        addToast({ type: 'error', title: t('common.error'), message: 'Nenhuma transação válida encontrada no arquivo OFX.' });
                        setUploading(false);
                        return;
                    }

                    const currentCategories = [...categories];
                    const newCategoriesToCreate = [];

                    const getOrCreateCategory = (catName) => {
                        const existing = currentCategories.find(c => c.name.toLowerCase() === catName.toLowerCase());
                        if (existing) return existing;

                        const newCat = {
                            id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: catName
                        };
                        currentCategories.push(newCat);
                        newCategoriesToCreate.push(newCat);
                        return newCat;
                    };

                    const categorizeName = (name) => {
                        const desc = name.toLowerCase();
                        const matchedRule = customRules.find(rule => desc.includes(rule.keyword));
                        if (matchedRule) {
                            return getOrCreateCategory(matchedRule.categoryName);
                        }

                        let categoryName = "Others";
                        const matches = (keywords) => keywords.some(kw => desc.includes(kw));

                        const transportKeywords = ["uber", "99app", "cabify", "indrive", "táxi", "taxi", "metrô", "metro", "cptm", "sptrans", "bilhete", "passagem", "pedágio", "pedagio", "semparar", "veloe", "combustivel", "posto", "petrobras", "ipiranga", "shell", "ale"];
                        const foodKeywords = ["ifood", "ubereats", "rappi", "restaurante", "bar", "padaria", "panificadora", "mercado", "supermercado", "hipermercado", "hortifruti", "açougue", "acougue", "bistrô", "bistro", "cafeteria", "starbucks", "mcdonalds", "bk", "burger", "pizza", "sushi", "cafe", "food"];
                        const entKeywords = ["netflix", "spotify", "steam", "epic", "playstation", "xbox", "nintendo", "cinema", "ingresso", "show", "teatro", "jogos", "game", "twitch", "youtube", "disney", "hbo", "prime", "globoplay"];
                        const housingKeywords = ["luz", "energia", "enel", "copel", "cemig", "light", "agua", "esgoto", "sabesp", "copasa", "sanepar", "internet", "net", "claro", "vivo", "tim", "telefonia", "aluguel", "condominio", "imobiliaria", "gás", "gas", "ultragaz"];
                        const healthKeywords = ["farmacia", "drogasil", "droga", "pague", "ultrafarma", "medico", "dentista", "consulta", "hospital", "clinica", "laboratorio", "exame", "saude", "unimed", "amil", "sulamerica"];
                        const eduKeywords = ["escola", "faculdade", "universidade", "curso", "udemy", "coursera", "livro", "livraria", "papelaria", "mensalidade", "colegio"];

                        if (matches(transportKeywords)) {
                            categoryName = "Transport";
                        } else if (matches(foodKeywords)) {
                            categoryName = "Food";
                        } else if (matches(entKeywords)) {
                            categoryName = "Entertainment";
                        } else if (matches(housingKeywords)) {
                            categoryName = "Housing";
                        } else if (matches(healthKeywords)) {
                            categoryName = "Health";
                        } else if (matches(eduKeywords)) {
                            categoryName = "Education";
                        }

                        return getOrCreateCategory(categoryName);
                    };

                    const total = parsedTransactions.length;
                    for (let i = 0; i < total; i++) {
                        const t = parsedTransactions[i];
                        
                        // Incrementally update progress
                        setUploadProgress(Math.round(((i + 1) / total) * 100));
                        setCurrentStepText(`Processando ${i + 1} de ${total} transações...`);

                        const tempId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        const transWithAccount = { ...t };
                        if (t.transactionType === 'EXPENSE') {
                            transWithAccount.outAccount = account;
                        } else {
                            transWithAccount.inAccount = account;
                        }
                        transWithAccount.category = categorizeName(t.name);

                        await saveLocalTransaction({
                            ...transWithAccount,
                            id: tempId,
                            synced: false
                        });
                    }

                    if (newCategoriesToCreate.length > 0) {
                        const cached = await getCachedCategories();
                        const updated = [...cached, ...newCategoriesToCreate];
                        await cacheCategories(updated);
                    }

                    addToast({ type: 'success', title: t('common.import'), message: `${parsedTransactions.length} transações importadas localmente!` });
                    
                    onSuccess();
                    fetchCategories();
                    handleClose();

                    syncOfflineTransactions().then(() => {
                        onSuccess();
                        fetchCategories();
                    }).catch(() => {});
                } catch (error) {
                    console.error(error);
                    addToast({ type: 'error', title: t('common.error'), message: 'Erro ao processar o arquivo OFX.' });
                    setUploading(false);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-brand-card border border-brand-border/60 shadow-2xl rounded-2xl p-6 flex flex-col gap-5 scale-100 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Importar Arquivo</h3>
                    {!uploading && (
                        <button onClick={handleClose} className="text-text-secondary hover:text-white transition-colors cursor-pointer">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Observation box */}
                <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-4 flex gap-3 text-sm text-text-secondary">
                    <AlertTriangle className="text-brand-primary shrink-0 w-5 h-5" />
                    <span>
                        <strong>Observação:</strong> Dependendo do tamanho do arquivo anexado, o processo de importação poderá demorar alguns minutos. Por favor, aguarde a conclusão.
                    </span>
                </div>

                {/* File Drop/Selector Area */}
                {!file && (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-brand-dark/20 ${
                            isDragging 
                                ? 'border-brand-primary bg-brand-primary/5 text-white scale-98' 
                                : 'border-brand-border hover:border-brand-primary/50 text-text-secondary hover:text-white'
                        }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".xlsx, .xls, .ofx"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                        />
                        <UploadCloud className={`w-12 h-12 mb-2 ${isDragging ? 'text-brand-primary animate-pulse' : 'text-text-muted'}`} />
                        <span className="font-semibold text-center">Arraste e solte o arquivo aqui ou clique para selecionar</span>
                        <span className="text-xs text-text-muted">Formatos suportados: .xlsx, .xls, .ofx</span>
                    </div>
                )}

                {/* Selected File Details */}
                {file && (
                    <div className="bg-brand-dark/40 border border-brand-border/50 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3 items-center min-w-0">
                                <div className="bg-brand-primary/20 p-2.5 rounded-lg text-brand-primary shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold text-white truncate text-sm">{file.name}</h4>
                                    <p className="text-xs text-text-secondary">{formatBytes(file.size)}</p>
                                </div>
                            </div>
                            {!uploading && (
                                <button 
                                    onClick={handleRemoveFile}
                                    className="text-text-muted hover:text-brand-danger transition-colors p-1 rounded-lg hover:bg-brand-danger/10 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* OFX specific bank account selector */}
                        {fileType === 'ofx' && !uploading && (
                            <div className="space-y-2 mt-2 pt-3 border-t border-brand-border/40">
                                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Conta Bancária de Destino</label>
                                <Select
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="w-full"
                                >
                                    <option value="">Selecione uma conta...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </Select>
                            </div>
                        )}

                        {/* Progress Bar & Status (when uploading/processing) */}
                        {uploading && (
                            <div className="space-y-3 mt-2 pt-3 border-t border-brand-border/40">
                                <div className="flex justify-between text-xs font-semibold text-text-secondary">
                                    <span className="flex items-center gap-1.5 min-w-0">
                                        <Loader2 className="animate-spin text-brand-primary shrink-0 w-3.5 h-3.5" />
                                        <span className="truncate">{currentStepText || "Processando..."}</span>
                                    </span>
                                    <span>{uploadProgress}%</span>
                                </div>

                                <div className="w-full bg-brand-border rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className="bg-brand-primary h-full rounded-full transition-all duration-300 ease-out" 
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-xxs text-text-muted font-medium">
                                    <span>
                                        {fileType === 'excel' && totalBytes > 0 
                                            ? `${formatBytes(uploadedBytes)} de ${formatBytes(totalBytes)}` 
                                            : ''
                                        }
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-2">
                    <Button 
                        variant="ghost" 
                        onClick={handleClose} 
                        disabled={uploading}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="success" 
                        onClick={startImport} 
                        disabled={
                            !file || 
                            uploading || 
                            (fileType === 'ofx' && !selectedAccountId)
                        }
                        className="font-bold min-w-28"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="animate-spin w-4 h-4 shrink-0" />
                                Importando...
                            </>
                        ) : (
                            'Importar'
                        )}
                    </Button>
                </div>

            </div>
        </div>
    );
}

export default ImportModal;
