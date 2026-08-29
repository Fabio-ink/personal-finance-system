import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Globe, 
  Tags, 
  Plus, 
  Trash2, 
  Search, 
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';
import { useCrud } from '../hooks/useCrud';
import { 
  getCategorizationRules, 
  saveCategorizationRule, 
  deleteCategorizationRule, 
  clearCategorizationRules 
} from '../services/db';

function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const { items: categories, fetchItems: fetchCategories } = useCrud('/categories');

  const currentLang = i18n.language || 'pt';

  // Categorization Rules state
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // New Rule Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadRules = async () => {
    try {
      setLoadingRules(true);
      const data = await getCategorizationRules().catch(() => []);
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoadingRules(false);
    }
  };

  useEffect(() => {
    loadRules();
    fetchCategories();
  }, [fetchCategories]);

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return rules;
    const query = searchQuery.toLowerCase().trim();
    return rules.filter(
      r => r.keyword.toLowerCase().includes(query) || r.categoryName.toLowerCase().includes(query)
    );
  }, [rules, searchQuery]);

  const handleOpenModal = () => {
    setNewKeyword('');
    setNewCategoryName(categories.length > 0 ? categories[0].name : '');
    setIsModalOpen(true);
  };

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newCategoryName.trim()) {
      addToast({ type: 'error', title: t('common.error'), message: t('common.requiredField') });
      return;
    }

    try {
      await saveCategorizationRule(newKeyword, newCategoryName);
      addToast({ type: 'success', title: t('common.success'), message: t('settings.ruleAdded') });
      setIsModalOpen(false);
      setNewKeyword('');
      setNewCategoryName('');
      await loadRules();
    } catch (err) {
      console.error('Error saving rule:', err);
      addToast({ type: 'error', title: t('common.error'), message: t('common.error') });
    }
  };

  const handleDeleteRule = async (keyword) => {
    if (window.confirm(t('settings.deleteRuleConfirm'))) {
      try {
        await deleteCategorizationRule(keyword);
        addToast({ type: 'success', title: t('common.success'), message: t('settings.ruleDeleted') });
        await loadRules();
      } catch (err) {
        console.error('Error deleting rule:', err);
        addToast({ type: 'error', title: t('common.error'), message: t('common.error') });
      }
    }
  };

  const handleClearAllRules = async () => {
    if (window.confirm(t('settings.clearAllConfirm'))) {
      try {
        await clearCategorizationRules();
        addToast({ type: 'success', title: t('common.success'), message: t('settings.allRulesCleared') });
        await loadRules();
      } catch (err) {
        console.error('Error clearing rules:', err);
        addToast({ type: 'error', title: t('common.error'), message: t('common.error') });
      }
    }
  };

  return (
    <div className="container mx-auto space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <PageTitle level={1} className="text-3xl font-bold text-white flex items-center gap-3">
          <Sliders className="text-brand-primary" size={32} />
          {t('settings.title')}
        </PageTitle>
      </div>

      {/* Language Selection Card */}
      <Card className="p-6 md:p-8 bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 rounded-3xl shadow-lg">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe size={22} className="text-brand-primary" /> 
            {t('settings.languageTitle')}
          </h3>
          <p className="text-xs text-text-secondary mt-1">
            {t('settings.languageDesc')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => i18n.changeLanguage('pt')}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              currentLang.startsWith('pt') 
                ? 'bg-brand-primary/15 border-brand-primary text-white shadow-lg shadow-brand-primary/10' 
                : 'bg-brand-dark/30 border-brand-border/20 text-gray-400 hover:border-brand-primary/40 hover:text-white'
            }`}
          >
            <span className="text-3xl">🇧🇷</span>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm">Português (Brasil)</p>
              <p className="text-xs text-text-secondary">Padrão</p>
            </div>
            {currentLang.startsWith('pt') && (
              <CheckCircle2 size={20} className="text-brand-primary shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => i18n.changeLanguage('en')}
            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              currentLang.startsWith('en') 
                ? 'bg-brand-primary/15 border-brand-primary text-white shadow-lg shadow-brand-primary/10' 
                : 'bg-brand-dark/30 border-brand-border/20 text-gray-400 hover:border-brand-primary/40 hover:text-white'
            }`}
          >
            <span className="text-3xl">🇺🇸</span>
            <div className="text-left flex-1">
              <p className="font-semibold text-sm">English</p>
              <p className="text-xs text-text-secondary">English translation</p>
            </div>
            {currentLang.startsWith('en') && (
              <CheckCircle2 size={20} className="text-brand-primary shrink-0" />
            )}
          </button>
        </div>
      </Card>

      {/* Categorization Rules Card */}
      <Card className="p-6 md:p-8 bg-brand-dark/40 backdrop-blur-md border border-brand-border/20 rounded-3xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Tags size={22} className="text-brand-primary" /> 
              {t('settings.rulesTitle')}
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-2xl leading-relaxed">
              {t('settings.rulesDesc')}
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {rules.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllRules}
                className="border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 text-xs py-2 px-3"
              >
                <Trash2 size={14} className="mr-1" />
                {t('settings.clearAllRules')}
              </Button>
            )}
            <Button
              onClick={handleOpenModal}
              className="bg-brand-primary/20 hover:bg-brand-primary/30 text-white border border-brand-primary/40 shadow-[0_0_15px_rgba(138,109,255,0.2)] px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 text-xs cursor-pointer font-semibold"
            >
              <Plus size={16} />
              {t('settings.addRule')}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {rules.length > 0 && (
          <div className="relative mb-6">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('settings.searchRules')}
              className="w-full pl-10 pr-4 py-2.5 bg-brand-dark/30 border border-brand-border/20 rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
        )}

        {/* Rules List / Table */}
        {loadingRules ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : filteredRules.length > 0 ? (
          <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
            {filteredRules.map((rule) => (
              <div 
                key={rule.keyword}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-dark/20 hover:bg-brand-card-hover/30 border border-brand-border/10 hover:border-brand-border/30 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-white text-sm block">
                      "{rule.keyword}"
                    </span>
                    <span className="text-xxs text-text-secondary">
                      Palavra-chave detectada em extratos/transações
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-primary/20 text-brand-primary border border-brand-primary/30 capitalize">
                    {t(`categories.${rule.categoryName.toLowerCase()}`, rule.categoryName)}
                  </span>
                  
                  <button
                    onClick={() => handleDeleteRule(rule.keyword)}
                    title={t('common.delete')}
                    className="p-2 text-text-secondary hover:text-brand-danger hover:bg-brand-danger/10 rounded-xl transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : rules.length > 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary text-sm">
              Nenhuma regra encontrada com a pesquisa "{searchQuery}".
            </p>
          </div>
        ) : (
          <div className="text-center py-12 px-4 border border-dashed border-brand-border/30 rounded-2xl bg-brand-dark/10">
            <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
              <Tags size={24} />
            </div>
            <h4 className="text-white font-semibold text-base mb-1">
              {t('settings.noRules')}
            </h4>
            <p className="text-text-secondary text-xs max-w-md mx-auto mb-4">
              {t('settings.noRulesDesc')}
            </p>
            <Button
              onClick={handleOpenModal}
              variant="secondary"
              size="sm"
            >
              <Plus size={16} className="mr-1.5" />
              {t('settings.addRule')}
            </Button>
          </div>
        )}
      </Card>

      {/* Add New Rule Modal */}
      <Modal isOpen={isModalOpen} onCancel={() => setIsModalOpen(false)}>
        <form onSubmit={handleSaveRule} className="space-y-5">
          <div>
            <h4 className="text-lg font-bold text-white mb-1">
              {t('settings.addRule')}
            </h4>
            <p className="text-xs text-text-secondary">
              Vincule uma palavra-chave presente no nome da transação para direcioná-la automaticamente a uma categoria.
            </p>
          </div>

          <Input
            id="rule-keyword"
            label={t('settings.keyword')}
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder={t('settings.keywordPlaceholder')}
            required
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
              {t('settings.category')}
            </label>
            {categories.length > 0 ? (
              <Select
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {t(`categories.${cat.name.toLowerCase()}`, cat.name)}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id="rule-category-text"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="ex: Alimentação"
                required
              />
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SettingsPage;
