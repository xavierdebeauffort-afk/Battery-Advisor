import React, { useState, useMemo } from 'react';
import { 
  Battery, 
  MapPin, 
  Building2, 
  Sun, 
  Wind, 
  Zap,
  Wallet,
  Settings,
  Target,
  AlertTriangle,
  CheckCircle,
  Users,
  FileText,
  Copy,
  Check,
  ChevronRight,
  Info,
  TrendingUp,
  Shield,
  Link2
} from 'lucide-react';

// ============================================
// CONFIGURATION DATA
// ============================================

const REGIONS = {
  flanders: {
    id: 'flanders',
    name: 'Flanders',
    primaryValue: 'Peak shaving (capacity tariff)',
    description: 'Capacity-based grid tariff since Jan 2023',
    notes: []
  },
  wallonia: {
    id: 'wallonia', 
    name: 'Wallonia',
    primaryValue: 'ToU arbitrage (from 2026)',
    description: '5 time-slot dynamic tariffs from January 2026',
    notes: ['ToU arbitrage available from January 2026']
  },
  brussels: {
    id: 'brussels',
    name: 'Brussels',
    primaryValue: 'Self-consumption',
    description: 'Limited ToU differentiation; focus on self-consumption',
    notes: []
  }
};

const CUSTOMER_SEGMENTS = {
  sme: { id: 'sme', name: 'SME', description: '< 1 MW connection' },
  midmarket: { id: 'midmarket', name: 'Mid-Market Industrial', description: '1-10 MW connection' },
  large: { id: 'large', name: 'Large Industrial', description: '> 10 MW connection' }
};

const GENERATION_ASSETS = {
  none: { id: 'none', name: 'None', icon: null },
  pv: { id: 'pv', name: 'Solar PV', icon: Sun },
  wind: { id: 'wind', name: 'Wind', icon: Wind },
  cogen: { id: 'cogen', name: 'Cogeneration', icon: Zap }
};

const FINANCING_OPTIONS = {
  own: { 
    id: 'own', 
    name: 'Customer Owns', 
    description: 'Capex investment, full control, capture depreciation',
    riskLevel: 'higher'
  },
  thirdparty: { 
    id: 'thirdparty', 
    name: 'Third-Party Owns', 
    description: 'Off balance sheet, pay for service/output',
    riskLevel: 'lower'
  },
  flexible: { 
    id: 'flexible', 
    name: 'Flexible / Lease', 
    description: 'Decide later, purchase option possible',
    riskLevel: 'medium'
  }
};

const OPERATIONS_OPTIONS = {
  handsoff: { 
    id: 'handsoff', 
    name: 'Fully Hands-Off', 
    description: 'Partner handles everything',
    complexity: 'low'
  },
  oversight: { 
    id: 'oversight', 
    name: 'Oversight & Input', 
    description: 'Partner operates, customer reviews and influences',
    complexity: 'medium'
  },
  active: { 
    id: 'active', 
    name: 'Active / Self-Manage', 
    description: 'Customer controls dispatch',
    complexity: 'high'
  }
};

const VALUE_STREAMS = {
  peakshaving: {
    id: 'peakshaving',
    name: 'Peak Shaving',
    description: 'Reduce capacity tariff / demand charges',
    capability: 'direct',
    regions: { flanders: 'primary', wallonia: 'secondary', brussels: 'minor' }
  },
  tou: {
    id: 'tou',
    name: 'ToU Grid Arbitrage',
    description: 'Charge low-tariff hours, discharge high-tariff',
    capability: 'direct',
    regions: { flanders: 'unavailable', wallonia: 'primary', brussels: 'unavailable' }
  },
  selfconsumption: {
    id: 'selfconsumption',
    name: 'Self-Consumption',
    description: 'Store on-site generation for later use',
    capability: 'direct',
    regions: { flanders: 'available', wallonia: 'available', brussels: 'primary' },
    requiresGeneration: true
  },
  wholesale: {
    id: 'wholesale',
    name: 'Wholesale Arbitrage',
    description: 'Day-ahead / intraday price optimization',
    capability: 'conditional',
    regions: { flanders: 'available', wallonia: 'available', brussels: 'available' }
  },
  imbalance: {
    id: 'imbalance',
    name: 'Imbalance Optimization',
    description: 'Position for system imbalance via BRP',
    capability: 'direct',
    regions: { flanders: 'available', wallonia: 'available', brussels: 'available' }
  },
  ancillary: {
    id: 'ancillary',
    name: 'Ancillary Services (FCR/aFRR/mFRR)',
    description: 'Frequency regulation & balancing reserves',
    capability: 'partnership',
    regions: { flanders: 'available', wallonia: 'available', brussels: 'available' }
  }
};

const CONTRACT_TYPES = {
  tolling: {
    id: 'tolling',
    name: 'Tolling Agreement',
    description: 'Fixed capacity payment (€/kW/year). Partner takes all market risk.',
    customerRisk: 1,
    supplierRisk: 5,
    keyTerms: [
      'Fixed capacity payment (€/kW/year)',
      'Variable O&M payment (€/MWh throughput)',
      'Availability guarantees with liquidated damages',
      'Partner has full dispatch authority',
      'Round-trip efficiency guarantees'
    ]
  },
  floorShare: {
    id: 'floorShare',
    name: 'Floor + Upside Share',
    description: 'Guaranteed minimum return plus share of revenues above floor.',
    customerRisk: 2,
    supplierRisk: 4,
    keyTerms: [
      'Guaranteed floor payment (€/kW/year)',
      'Revenue share above floor (e.g., 70/30)',
      'Clear definition of included revenue streams',
      'Annual reconciliation mechanism',
      'Performance benchmarking clause'
    ]
  },
  revenueShareFloor: {
    id: 'revenueShareFloor',
    name: 'Revenue Share with Floor',
    description: 'Protected downside with participation in market upside.',
    customerRisk: 3,
    supplierRisk: 3,
    keyTerms: [
      'Base revenue share ratio (e.g., 60/40)',
      'Minimum floor protection',
      'Quarterly or monthly settlement',
      'Audit rights for optimization performance',
      'Defined value stream inclusion'
    ]
  },
  revenueShare: {
    id: 'revenueShare',
    name: 'Pure Revenue Share',
    description: 'Direct percentage split of all revenues. Full alignment of interests.',
    customerRisk: 4,
    supplierRisk: 2,
    keyTerms: [
      'Revenue split ratio (e.g., 70/30 or 80/20)',
      'Gross vs. net revenue definition',
      'Cost pass-through mechanisms',
      'Performance KPIs and reporting',
      'Benchmark comparison rights'
    ]
  },
  fixedFee: {
    id: 'fixedFee',
    name: 'Fixed Service Fee',
    description: 'Customer keeps 100% of revenues, pays fixed fee for optimization service.',
    customerRisk: 5,
    supplierRisk: 1,
    keyTerms: [
      'Fixed monthly/annual service fee',
      'All revenues pass through to customer',
      'Service level agreements (SLAs)',
      'Performance guarantees',
      'Liability caps for underperformance'
    ]
  }
};

// ============================================
// RECOMMENDATION ENGINE
// ============================================

function generateRecommendation(inputs) {
  const { region, segment, generation, financing, operations, valueStreams } = inputs;
  
  const result = {
    ownership: null,
    operatingModel: null,
    contractType: null,
    capabilityStatus: 'direct',
    warnings: [],
    justification: [],
    nextSteps: []
  };

  if (!region || !financing || !operations) {
    return null;
  }

  // 1. DETERMINE OWNERSHIP MODEL
  if (financing === 'own') {
    result.ownership = 'Customer-Owned';
    result.justification.push('Customer owns the asset, capturing depreciation benefits and maintaining full control.');
  } else if (financing === 'thirdparty') {
    result.ownership = 'Third-Party Owned (EaaS)';
    result.justification.push('Third-party ownership keeps the asset off balance sheet with predictable costs.');
  } else {
    result.ownership = 'Flexible / Lease';
    result.justification.push('Lease structure provides flexibility to decide on ownership later.');
  }

  // 2. DETERMINE OPERATING MODEL & CAPABILITY STATUS
  const hasAncillary = valueStreams.includes('ancillary');
  const hasWholesale = valueStreams.includes('wholesale');

  if (hasAncillary) {
    result.capabilityStatus = 'partnership';
    result.warnings.push({
      type: 'info',
      message: 'Ancillary services (FCR/aFRR/mFRR) require aggregator partnership — we facilitate this connection.'
    });
  } else if (hasWholesale && operations === 'active') {
    result.capabilityStatus = 'conditional';
    result.warnings.push({
      type: 'info', 
      message: 'Wholesale arbitrage for self-operating customers requires market access or pass-through contract structure.'
    });
  }

  if (operations === 'handsoff') {
    if (hasAncillary) {
      result.operatingModel = 'Aggregator-Managed (via Partnership)';
      result.justification.push('Full-stack value including ancillary services requires specialized aggregator partnership.');
    } else {
      result.operatingModel = 'Supplier-Managed';
      result.justification.push('Hands-off operation with supplier handling all optimization within capability scope.');
    }
  } else if (operations === 'oversight') {
    if (hasAncillary) {
      result.operatingModel = 'Hybrid (Supplier + Aggregator)';
      result.justification.push('Combined management model with oversight: supplier handles BTM, aggregator handles ancillary.');
    } else {
      result.operatingModel = 'Supplier-Managed with Oversight';
      result.justification.push('Supplier operates with regular reporting and customer input on priorities.');
    }
  } else {
    if (hasAncillary) {
      result.operatingModel = 'Co-Pilot (Customer + Aggregator)';
      result.justification.push('Customer maintains active involvement alongside aggregator for ancillary services.');
    } else {
      result.operatingModel = 'Self-Operate / Minimal Service';
      result.justification.push('Customer controls dispatch with optional optimization platform/support.');
    }
  }

  // 3. INFER RISK APPETITE & DETERMINE CONTRACT TYPE
  let riskScore = 0;
  
  if (financing === 'own') riskScore += 2;
  else if (financing === 'flexible') riskScore += 1;
  
  if (operations === 'active') riskScore += 2;
  else if (operations === 'oversight') riskScore += 1;
  
  if (hasAncillary || hasWholesale) riskScore += 1;
  
  if (segment === 'large') riskScore += 1;
  else if (segment === 'sme') riskScore -= 1;

  if (riskScore <= 1) {
    result.contractType = CONTRACT_TYPES.tolling;
  } else if (riskScore === 2) {
    result.contractType = CONTRACT_TYPES.floorShare;
  } else if (riskScore === 3) {
    result.contractType = CONTRACT_TYPES.revenueShareFloor;
  } else if (riskScore === 4) {
    result.contractType = CONTRACT_TYPES.revenueShare;
  } else {
    result.contractType = CONTRACT_TYPES.fixedFee;
  }

  // 4. REGIONAL WARNINGS
  if (region === 'wallonia' && valueStreams.includes('tou')) {
    result.warnings.push({
      type: 'warning',
      message: 'ToU grid arbitrage available from January 2026 — plan for future value or focus on other streams initially.'
    });
  }

  if (region === 'brussels' && generation.length === 0) {
    result.warnings.push({
      type: 'warning',
      message: 'Limited value proposition in Brussels without on-site generation — primary BTM value requires PV, wind, or cogeneration.'
    });
  }

  // 5. SEGMENT WARNINGS
  if (segment === 'sme' && operations === 'active') {
    result.warnings.push({
      type: 'warning',
      message: 'Active self-operation may be complex for SME customers — consider managed service to reduce operational burden.'
    });
  }

  // 6. FINANCING/OPERATIONS MISMATCH
  if (financing === 'thirdparty' && operations === 'active') {
    result.warnings.push({
      type: 'warning',
      message: 'Third-party ownership with self-operation is unusual — clarify dispatch authority and responsibilities.'
    });
  }

  // 7. SELF-CONSUMPTION WITHOUT GENERATION
  if (valueStreams.includes('selfconsumption') && generation.length === 0) {
    result.warnings.push({
      type: 'error',
      message: 'Self-consumption requires on-site generation (PV, wind, or cogeneration).'
    });
  }

  // 8. GENERATE NEXT STEPS
  result.nextSteps = [
    {
      category: 'Data to Request',
      items: [
        'Load profile data (15-minute intervals, 12 months ideal)',
        'Current peak demand (kW) and annual consumption (MWh)',
        region === 'flanders' ? 'Fluvius capacity tariff invoice / My Fluvius data' : null,
        generation.length > 0 ? 'Generation profile data (if available)' : null,
        'Grid connection details and any constraints'
      ].filter(Boolean)
    },
    {
      category: 'Internal Actions',
      items: [
        hasAncillary ? 'Engage aggregator partner for prequalification discussion' : null,
        'Prepare indicative business case with available data',
        'Technical review: assess metering requirements',
        segment === 'large' ? 'Involve commercial/legal for contract structuring' : null
      ].filter(Boolean)
    },
    {
      category: 'Customer Discussion Points',
      items: [
        'Confirm investment timeline and decision process',
        'Understand priority: cost reduction vs. revenue generation',
        'Clarify operational involvement appetite',
        financing === 'flexible' ? 'Explore ownership preference drivers' : null,
        'Discuss any existing flexibility contracts or aggregator relationships'
      ].filter(Boolean)
    }
  ];

  return result;
}

// ============================================
// UI COMPONENTS
// ============================================

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-blue-100 rounded-lg">
      <Icon className="w-5 h-5 text-blue-600" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

const RadioOption = ({ selected, onSelect, title, description, disabled }) => (
  <button
    onClick={() => !disabled && onSelect()}
    disabled={disabled}
    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
      disabled 
        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
        : selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
      </div>
      <div>
        <div className="font-medium text-gray-800">{title}</div>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
    </div>
  </button>
);

const CheckboxOption = ({ checked, onChange, title, description, badge, badgeColor, disabled }) => (
  <button
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
      disabled
        ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
        : checked
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
        checked ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
      }`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-800">{title}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
    </div>
  </button>
);

const CapabilityBadge = ({ capability }) => {
  const styles = {
    direct: { bg: 'bg-green-100', text: 'text-green-700', label: 'Direct' },
    conditional: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Conditional' },
    partnership: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Partnership' }
  };
  const style = styles[capability] || styles.direct;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

const RiskSpectrum = ({ customerRisk, supplierRisk }) => (
  <div className="space-y-3">
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">Customer Risk</span>
        <span className="font-medium">{customerRisk}/5</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full transition-all"
          style={{ width: `${(customerRisk / 5) * 100}%` }}
        />
      </div>
    </div>
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">Supplier Risk</span>
        <span className="font-medium">{supplierRisk}/5</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full transition-all"
          style={{ width: `${(supplierRisk / 5) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

const WarningCard = ({ type, message }) => {
  const styles = {
    error: { bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-500' },
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', iconColor: 'text-yellow-500' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-500' }
  };
  const style = styles[type] || styles.info;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}>
      {type === 'info' ? (
        <Info className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
      ) : (
        <AlertTriangle className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
      )}
      <p className="text-sm text-gray-700">{message}</p>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

function App() {
  const [region, setRegion] = useState('');
  const [segment, setSegment] = useState('');
  const [generation, setGeneration] = useState([]);
  const [financing, setFinancing] = useState('');
  const [operations, setOperations] = useState('');
  const [valueStreams, setValueStreams] = useState([]);
  const [copied, setCopied] = useState(false);

  const toggleGeneration = (assetId) => {
    if (assetId === 'none') {
      setGeneration([]);
    } else {
      setGeneration(prev => 
        prev.includes(assetId) 
          ? prev.filter(g => g !== assetId)
          : [...prev, assetId]
      );
    }
  };

  const toggleValueStream = (streamId) => {
    setValueStreams(prev =>
      prev.includes(streamId)
        ? prev.filter(vs => vs !== streamId)
        : [...prev, streamId]
    );
  };

  const availableValueStreams = useMemo(() => {
    if (!region) return [];
    return Object.values(VALUE_STREAMS).filter(vs => {
      const regionStatus = vs.regions[region];
      return regionStatus && regionStatus !== 'unavailable';
    });
  }, [region]);

  const recommendation = useMemo(() => {
    return generateRecommendation({
      region,
      segment,
      generation,
      financing,
      operations,
      valueStreams
    });
  }, [region, segment, generation, financing, operations, valueStreams]);

  const copyToClipboard = () => {
    if (!recommendation) return;
    
    const regionName = REGIONS[region]?.name || region;
    const segmentName = CUSTOMER_SEGMENTS[segment]?.name || segment;
    const genAssets = generation.length > 0 
      ? generation.map(g => GENERATION_ASSETS[g]?.name).join(', ')
      : 'None';
    
    const summary = `BTM BATTERY ADVISOR - RECOMMENDATION SUMMARY
=============================================

CUSTOMER PROFILE
- Region: ${regionName}
- Segment: ${segmentName}
- On-site Generation: ${genAssets}
- Financing: ${FINANCING_OPTIONS[financing]?.name}
- Operations: ${OPERATIONS_OPTIONS[operations]?.name}
- Value Streams: ${valueStreams.map(vs => VALUE_STREAMS[vs]?.name).join(', ')}

RECOMMENDATION
- Ownership: ${recommendation.ownership}
- Operating Model: ${recommendation.operatingModel}
- Contract Type: ${recommendation.contractType.name}
- Capability Status: ${recommendation.capabilityStatus.toUpperCase()}

CONTRACT KEY TERMS
${recommendation.contractType.keyTerms.map(t => `• ${t}`).join('\n')}

RISK PROFILE
- Customer Risk: ${recommendation.contractType.customerRisk}/5
- Supplier Risk: ${recommendation.contractType.supplierRisk}/5

${recommendation.warnings.length > 0 ? `WARNINGS\n${recommendation.warnings.map(w => `• ${w.message}`).join('\n')}` : ''}

NEXT STEPS
${recommendation.nextSteps.map(ns => `${ns.category}:\n${ns.items.map(i => `  • ${i}`).join('\n')}`).join('\n\n')}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasMinimumInputs = region && financing && operations && valueStreams.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Battery className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">BTM Battery Advisor</h1>
              <p className="text-gray-500">Generate consistent recommendations for B2B battery opportunities</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - INPUTS */}
          <div className="space-y-6">
            
            {/* Region Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader 
                icon={MapPin} 
                title="Region" 
                subtitle="Determines primary value stream"
              />
              <div className="space-y-2">
                {Object.values(REGIONS).map(r => (
                  <RadioOption
                    key={r.id}
                    selected={region === r.id}
                    onSelect={() => {
                      setRegion(r.id);
                      setValueStreams([]);
                    }}
                    title={r.name}
                    description={r.description}
                  />
                ))}
              </div>
              {region && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Primary value:</strong> {REGIONS[region].primaryValue}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Segment */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader 
                icon={Building2} 
                title="Customer Segment" 
                subtitle="Affects guidance and defaults"
              />
              <div className="space-y-2">
                {Object.values(CUSTOMER_SEGMENTS).map(s => (
                  <RadioOption
                    key={s.id}
                    selected={segment === s.id}
                    onSelect={() => setSegment(s.id)}
                    title={s.name}
                    description={s.description}
                  />
                ))}
              </div>
            </div>

            {/* On-site Generation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader 
                icon={Sun} 
                title="On-site Generation" 
                subtitle="Unlocks self-consumption value"
              />
              <div className="space-y-2">
                <CheckboxOption
                  checked={generation.length === 0}
                  onChange={() => setGeneration([])}
                  title="None"
                  description="No on-site generation assets"
                />
                {Object.values(GENERATION_ASSETS).filter(g => g.id !== 'none').map(g => {
                  const Icon = g.icon;
                  return (
                    <CheckboxOption
                      key={g.id}
                      checked={generation.includes(g.id)}
                      onChange={() => toggleGeneration(g.id)}
                      title={
                        <span className="flex items-center gap-2">
                          {Icon && <Icon className="w-4 h-4" />}
                          {g.name}
                        </span>
                      }
                    />
                  );
                })}
              </div>
            </div>

            {/* Financing Preference */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader 
                icon={Wallet} 
                title="Financing Preference" 
                subtitle="Who owns the asset?"
              />
              <div className="space-y-2">
                {Object.values(FINANCING_OPTIONS).map(f => (
                  <RadioOption
                    key={f.id}
                    selected={financing === f.id}
                    onSelect={() => setFinancing(f.id)}
                    title={f.name}
                    description={f.description}
                  />
                ))}
              </div>
            </div>

            {/* Operations Preference */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader 
                icon={Settings} 
                title="Operations Preference" 
                subtitle="How involved does customer want to be?"
              />
              <div className="space-y-2">
                {Object.values(OPERATIONS_OPTIONS).map(o => (
                  <RadioOption
                    key={o.id}
                    selected={operations === o.id}
                    onSelect={() => setOperations(o.id)}
                    title={o.name}
                    description={o.description}
                  />
                ))}
              </div>
            </div>

            {/* Value Streams */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <SectionHeader 
                icon={Target} 
                title="Desired Value Streams" 
                subtitle="What value does customer want to capture?"
              />
              {!region ? (
                <p className="text-gray-500 text-sm italic">Select a region first to see available value streams</p>
              ) : (
                <div className="space-y-2">
                  {availableValueStreams.map(vs => {
                    const regionStatus = vs.regions[region];
                    const isDisabled = vs.requiresGeneration && generation.length === 0;
                    
                    let badge = null;
                    let badgeColor = '';
                    
                    if (regionStatus === 'primary') {
                      badge = 'Primary';
                      badgeColor = 'bg-green-100 text-green-700';
                    } else if (regionStatus === 'secondary') {
                      badge = 'Secondary';
                      badgeColor = 'bg-gray-100 text-gray-600';
                    } else if (regionStatus === 'minor') {
                      badge = 'Minor';
                      badgeColor = 'bg-gray-100 text-gray-500';
                    }

                    return (
                      <CheckboxOption
                        key={vs.id}
                        checked={valueStreams.includes(vs.id)}
                        onChange={() => toggleValueStream(vs.id)}
                        title={
                          <span className="flex items-center gap-2">
                            {vs.name}
                            <CapabilityBadge capability={vs.capability} />
                          </span>
                        }
                        description={isDisabled ? 'Requires on-site generation' : vs.description}
                        badge={badge}
                        badgeColor={badgeColor}
                        disabled={isDisabled}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - OUTPUTS */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 lg:sticky lg:top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Recommendation</h2>
                {recommendation && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {!hasMinimumInputs ? (
                <div className="text-center py-12 text-gray-400">
                  <Battery className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Complete the inputs to see recommendation</p>
                  <p className="text-sm mt-1">Region, financing, operations, and at least one value stream required</p>
                </div>
              ) : recommendation ? (
                <div className="space-y-6">
                  {/* Main Recommendation */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-700">Ownership:</span>
                        <span className="text-gray-900">{recommendation.ownership}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-700">Operating Model:</span>
                        <span className="text-gray-900">{recommendation.operatingModel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-gray-700">Contract:</span>
                        <span className="text-gray-900">{recommendation.contractType.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Capability Status */}
                  <div className={`p-4 rounded-xl border ${
                    recommendation.capabilityStatus === 'direct' 
                      ? 'bg-green-50 border-green-200'
                      : recommendation.capabilityStatus === 'partnership'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {recommendation.capabilityStatus === 'direct' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : recommendation.capabilityStatus === 'partnership' ? (
                        <Link2 className="w-6 h-6 text-orange-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {recommendation.capabilityStatus === 'direct' && 'We can deliver this directly'}
                          {recommendation.capabilityStatus === 'partnership' && 'Partnership required'}
                          {recommendation.capabilityStatus === 'conditional' && 'Conditional on contract structure'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {recommendation.capabilityStatus === 'direct' && 'All selected value streams within our current capability'}
                          {recommendation.capabilityStatus === 'partnership' && 'We facilitate connection with aggregator partners'}
                          {recommendation.capabilityStatus === 'conditional' && 'Wholesale arbitrage requires integrated supply model'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Visualization */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Risk Allocation
                    </h4>
                    <RiskSpectrum 
                      customerRisk={recommendation.contractType.customerRisk}
                      supplierRisk={recommendation.contractType.supplierRisk}
                    />
                  </div>

                  {/* Warnings */}
                  {recommendation.warnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Watch-outs
                      </h4>
                      {recommendation.warnings.map((warning, idx) => (
                        <WarningCard key={idx} type={warning.type} message={warning.message} />
                      ))}
                    </div>
                  )}

                  {/* Justification */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Why This Recommendation
                    </h4>
                    <p className="text-sm text-gray-600">
                      {recommendation.justification.join(' ')}
                    </p>
                  </div>

                  {/* Contract Key Terms */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Key Contract Terms to Discuss
                    </h4>
                    <ul className="space-y-1">
                      {recommendation.contractType.keyTerms.map((term, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Next Steps Checklist
                    </h4>
                    <div className="space-y-4">
                      {recommendation.nextSteps.map((section, idx) => (
                        <div key={idx}>
                          <p className="text-sm font-medium text-gray-600 mb-2">{section.category}</p>
                          <ul className="space-y-1 ml-1">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          BTM Battery Advisor v1.0 — For internal sales use
        </div>
      </div>
    </div>
  );
}

export default App;
