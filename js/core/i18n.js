'use strict';
// ============================================================
// CURRENCIES — Top 10 most used currencies (single source of truth)
// ============================================================
var CURRENCIES = [
  { code: 'CLP', name: 'Chilean Peso',       symbol: '$'  },
  { code: 'USD', name: 'US Dollar',           symbol: '$'  },
  { code: 'EUR', name: 'Euro',                symbol: '€'  },
  { code: 'JPY', name: 'Japanese Yen',        symbol: '¥'  },
  { code: 'GBP', name: 'British Pound',       symbol: '£'  },
  { code: 'AUD', name: 'Australian Dollar',   symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar',     symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc',         symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan',        symbol: '¥'  },
  { code: 'BRL', name: 'Brazilian Real',      symbol: 'R$' }
];

// ============================================================
// I18N — Internationalization module
// Industry-standard approach: key-based lookup, data-i18n attrs,
// localStorage persistence, automatic DOM re-render on switch.
// Must load FIRST (before all other modules).
// ============================================================
var I18n = {
  locale: 'es',

  _data: {
    es: {
      app:   { title: 'Salud Financiera v1.2' },
      brand: { line1: 'SALUD', line2: 'FINANCIERA' },
      nav: {
        wealth: 'PATRIMONIO', system: 'SISTEMA',
        investments: 'Inversiones', properties: 'Propiedades',
        emergency: 'Fondos Emergencia', pension: 'Fondos de Pensión',
        networth: 'Patrimonio Neto', settings: 'Ajustes'
      },
      ticker: { label: 'MERCADO', refresh: 'Actualizar', export: 'Export', import: 'Import' },
      investments: {
        title: 'Inversiones',
        subtitle: 'Snapshots mensuales — rendimiento y sugerencias de asignación',
        addSnapshot: '+ Snapshot',
        manageFunds: 'Fondos',
        monthLabel: 'Mes',
        sectionSnapshot: 'Snapshot del Mes',
        chartHistory: 'Histórico por Fondo',
        chartReturn: 'Rendimiento (%)',
        modal: {
          titleAdd: 'Registrar Snapshot de Inversión',
          titleEdit: 'Editar Snapshot',
          labelMonth: 'Mes', labelFund: 'Fondo',
          labelPrevBalance: 'Balance Mes Anterior',
          labelCurrBalance: 'Balance Actual',
          labelCurrency: 'Moneda',
          labelInvested: 'Invertido este mes',
          titleFunds: 'Gestionar Fondos',
          labelFundName: 'Nombre', labelFundCurrency: 'Moneda', labelFundDesc: 'Descripción',
          saveFund: 'Agregar Fondo', updateFund: 'Actualizar Fondo', cancelEdit: 'Cancelar edición',
          marketIds: 'Identificadores de mercado (opcional)',
          labelTicker: 'Ticker', labelIsin: 'ISIN', labelRunCmf: 'RUN CMF',
          labelCusip: 'CUSIP', labelBloomberg: 'Bloomberg Ticker', labelPriceSource: 'Fuente de precio',
          helpTicker: 'Símbolo bursátil para ETFs y acciones. Ej: VOO, SPY. Búscalo en Yahoo Finance o tu broker.',
          helpIsin: 'Código ISO 6166, 12 caracteres. Ej: IE000JIZVX47. Búscalo en el prospecto del fondo o isin.org.',
          helpRunCmf: 'RUN del fondo en CMF Chile. Solo dígitos, 4-6 chars. Búscalo en cmfchile.cl → Fondos Mutuos.',
          helpCusip: '9 caracteres alfanuméricos. Identifica instrumentos del mercado USA. Opcional.',
          helpBloomberg: 'Ticker de Bloomberg para referencia interna. No se usa en APIs públicas actualmente.',
          helpPriceSource: 'API a usar para obtener precio o rendimiento. Las opciones disponibles dependen del identificador configurado.',
          priceSrcNone: '— Sin fuente automática', priceSrcCmf: 'CMF Chile',
          priceSrcYahoo: 'Yahoo Finance', priceSrcAlpha: 'Alpha Vantage',
          priceSrcMorningstar: 'Morningstar', priceSrcManual: 'Manual',
          previewEmpty: 'Ingresa balances para ver rendimiento',
          save: 'Guardar', cancel: 'Cancelar'
        },
        kpi: {
          portfolio: 'Portfolio (CLP)', avgReturn: 'Retorno Promedio',
          invested: 'Invertido mes', activeFunds: 'Fondos activos'
        },
        table: {
          fund: 'Fondo', currency: 'Moneda', prev: 'Anterior',
          curr: 'Actual', return: 'Retorno %', mktGain: 'Retorno $', clpEquiv: 'CLP equiv.',
          portPct: '% Port.', invested: 'Invertido'
        },
        suggest: {
          title: 'Sugerencia de Inversión',
          savingsTarget: 'Meta ahorro:', invested: 'Invertido:', available: 'Disponible:',
          tableClpFund: 'Fondo CLP', tableWeight: 'Peso actual', tableSuggest: 'Sugerir invertir',
          noClpFunds: 'No hay fondos CLP en este mes para calcular sugerencia.',
          configSalary: 'Configure salario en Ajustes para ver sugerencias.'
        },
        preview: { variation: 'VARIACIÓN', diff: 'DIFERENCIA' },
        empty: {
          noSnaps: 'Sin snapshots para {{month}}.',
          hint: 'Usa ◀ ▶ para navegar o + Snapshot para agregar.'
        },
        confirm: { deleteSnap: 'Eliminar snapshot?', deleteFund: 'Eliminar fondo?' },
        livePrices: {
          title: 'Precios actuales',
          fund: 'Fondo', source: 'Fuente', price: 'Precio', change: 'Var. 1d',
          loading: 'Actualizando…', noFunds: '',
          stale: 'datos anteriores', refreshTitle: 'Actualizar precios de mercado'
        }
      },
      properties: {
        title: 'Propiedades',
        subtitle: 'Hipotecas — Arriendos — Plusvalía m²',
        addProperty: '+ Agregar', addRent: 'Registrar Arriendo', addM2: 'Valor m²',
        sectionRents: 'Historial Arriendos',
        modal: {
          titleAdd: 'Agregar Propiedad', titleEdit: 'Editar Propiedad',
          titleAddRent: 'Registrar Arriendo', titleEditRent: 'Editar Arriendo',
          titleAddM2: 'Registrar Valor m²', titleEditM2: 'Editar Valor m²',
          labelName: 'Nombre', labelAddress: 'Dirección', labelCommune: 'Comuna',
          labelUnit: 'Unidad', labelSqm: 'm²', labelBeds: 'Dorms', labelBaths: 'Baños',
          labelLayout: 'Layout', labelParking: 'Estacionamiento', labelStorage: 'Bodega',
          mortgageSection: 'Crédito Hipotecario',
          labelUfPrice: 'Valor compra (UF)', labelUfLoan: 'Monto crédito (UF)', labelUfFee: 'Cuota (UF)',
          labelTotalInst: 'Total cuotas', labelPaid: 'Pagadas',
          labelBank: 'Banco', labelRate: 'Tasa anual (%)',
          labelCreditType: 'Tipo crédito', labelNotes: 'Notas',
          labelExtraComm: 'Gastos adicionales por defecto (CLP)',
          labelProperty: 'Propiedad', labelMonth: 'Mes',
          labelRentAmount: 'Arriendo cobrado (CLP)',
          labelAdditionalIncome: 'Ingresos adicionales (CLP)',
          labelDividend: 'Dividendo (CLP)', labelCommission: 'Comisión admin',
          labelOtherExpenses: 'Otros gastos (CLP)', labelNetFlow: 'Flujo Neto (auto)',
          labelM2Value: 'Valor m² (CLP)',
          save: 'Guardar', register: 'Registrar', cancel: 'Cancelar', close: 'Cerrar'
        },
        kpi: { count: 'Propiedades', debtUF: 'Deuda UF', netMonth: 'Flujo Neto Mes', netYear: 'Flujo Neto Año' },
        card: {
          beds: 'DORMS', baths: 'BAÑOS', parking: 'ESTAC.', mortgage: 'Crédito',
          bank: 'Banco:', rate: 'Tasa:', fee: 'Cuota:', clp: 'CLP:',
          estDebt: 'Deuda est.:', appreciation: 'Plusvalía aprox:',
          cost: 'Precio compra:', paidSoFar: 'Pagado a la fecha:',
          recentRents: 'Últimos arriendos', edit: 'Editar'
        },
        m2Table: { property: 'Propiedad', month: 'Mes', value: 'Valor m²', noRecords: 'Sin registros' },
        rentTable: {
          property: 'Propiedad', month: 'Mes', rent: 'Arriendo',
          additionalIncome: 'Ing. adicionales', dividend: 'Dividendo',
          commission: 'Comisión', otherExpenses: 'Otros gastos',
          netFlow: 'Flujo Neto', notes: 'Notas', noRents: 'Sin arriendos registrados'
        },
        confirm: { deleteProperty: 'Eliminar propiedad?', deleteM2: 'Eliminar registro de valor m²?', deleteRent: 'Eliminar?' }
      },
      emergency: {
        title: 'Fondos de Emergencia',
        subtitle: 'Fondos de reserva y metas de seguridad financiera',
        addFund: '+ Añadir Fondo',
        modal: {
          titleAdd: 'Crear Fondo de Emergencia', titleEdit: 'Editar Fondo de Emergencia',
          labelName: 'Nombre del fondo', labelDesc: 'Descripción / Objetivo',
          labelInvestment: 'Inversión base', goalTypeSection: 'Tipo de Meta',
          labelGoalBasis: 'Categoría base',
          labelGoalValue: 'Número de meses', labelGoalValueAmount: 'Monto (CLP)',
          labelNotes: 'Notas (opcional)',
          previewEmpty: 'Completa los campos para ver preview',
          selectInvestment: '-- Selecciona una inversión --',
          goalTypeParamMonths: 'Meses × parámetros',
          goalTypeDivMonths: 'Meses de dividendos',
          goalTypeFixed: 'Monto fijo (CLP)',
          basisNeeds: '% Necesidades', basisWants: '% Deseos', basisSalary: 'Sueldo completo',
          basisNeedsLabel: '% Necesidades', basisWantsLabel: '% Deseos',
          basisSalaryLabel: '100% Sueldo completo',
          perMonth: '/mes', paramsInfo: 'Parámetros configurables en Ajustes',
          save: 'Guardar', cancel: 'Cancelar'
        },
        kpi: { totalGoal: 'Meta Total', totalBalance: 'Balance Total', shortfall: 'Faltante', avgProgress: 'Avance Promedio' },
        card: {
          progress: 'Progreso', balance: 'BALANCE', goal: 'META', shortfall: 'FALTANTE',
          edit: 'Editar', unknownInvestment: 'Inversión desconocida',
          goalLabelMonths: 'meses ×', goalLabelDivMonths: 'meses de dividendos', goalLabelFixed: 'fijo',
          basisNeeds: '% necesidades', basisWants: '% deseos', basisSalary: 'sueldo completo'
        },
        empty: { title: 'Aún no hay fondos de emergencia', hint: 'Crea uno para comenzar a rastrear tus metas' },
        preview: { goal: 'META', balance: 'BALANCE', shortfall: 'FALTANTE', progress: 'AVANCE' },
        confirm: { deleteFund: '¿Eliminar este fondo de emergencia?' }
      },
      pension: {
        title: 'Fondos de Pensión',
        subtitle: 'Ahorro previsional — saldo acumulado por fondo',
        addFund: '+ Añadir Fondo',
        modal: {
          titleAdd: 'Añadir Fondo de Pensión', titleEdit: 'Editar Fondo de Pensión',
          labelDesc: 'Descripción', labelAmount: 'Saldo acumulado', labelCurrency: 'Moneda',
          save: 'Guardar', cancel: 'Cancelar'
        },
        kpi: { count: 'Fondos', total: 'Total', largest: 'Mayor fondo', currencies: 'Monedas' },
        card: { balance: 'SALDO', equivalent: 'EQUIVALENTE', edit: 'Editar' },
        empty: { title: 'Aún no hay fondos de pensión', hint: 'Añade uno para comenzar a rastrear tu ahorro previsional' },
        confirm: { deleteFund: '¿Eliminar este fondo de pensión?' }
      },
      networth: {
        title: 'Patrimonio Neto',
        subtitle: 'Estimación basada en tus inversiones, fondos de pensión y propiedades',
        assetsSection: 'Activos', liabilitiesSection: 'Pasivos',
        totalAssets: 'Total Activos', totalLiabilities: 'Total Pasivos', netWorth: 'Patrimonio Neto',
        items: {
          investments: 'Inversiones', pension: 'Fondos de Pensión',
          properties: 'Propiedades — Valor Mercado', mortgages: 'Hipotecas pendientes'
        },
        sources: { m2: 'valor m²', uf: 'precio compra UF' },
        kpi: { assets: 'Activos', liabilities: 'Pasivos', netWorth: 'Patrimonio Neto', coverage: 'Cobertura' },
        notes: {
          investmentsEmpty: 'Sin snapshots de inversiones', pensionEmpty: 'Sin fondos de pensión',
          propertiesEmpty: 'Sin propiedades con valor estimable', mortgagesEmpty: 'Sin hipotecas registradas'
        }
      },
      settings: {
        title: 'Ajustes', subtitle: 'Parámetros financieros — Datos locales',
        financialSection: 'Parámetros Financieros', localDataSection: 'Datos Locales',
        archSection: 'Arquitectura',
        labelSalary: 'Salario mensual (CLP)', labelNeeds: '% Necesidades',
        labelWants: '% Deseos', labelCommission: 'Comisión admin. propiedades (%)',
        labelPrimaryCurrency: 'Moneda principal',
        savings: 'Ahorro:',
        marketPricesSection: 'Precios de Mercado',
        labelFpTtlShort: 'Caché cotizaciones (min)',
        labelFpTtlLong:  'Caché fondos CMF (min)',
        labelFpStagger:  'Retraso entre peticiones (ms)',
        labelFpTimeout:  'Timeout de conexión (s)',
        fpHintTtlShort:  'Tiempo antes de re-consultar Yahoo / Alpha Vantage / Morningstar. Por defecto 15 min.',
        fpHintTtlLong:   'Tiempo antes de re-consultar CMF Chile (publica una vez al día). Por defecto 240 min.',
        fpHintStagger:   'Espera entre requests al proxy para no saturarlo. Por defecto 300 ms.',
        fpHintTimeout:   'Tiempo máximo de espera por respuesta del proxy. Por defecto 12 s.',
        labelFpProxy1:   'Proxy CORS primario',
        labelFpProxy2:   'Proxy CORS secundario',
        fpHintProxy:     'Proxy que el browser usa para sortear CORS de las APIs externas. El secundario actúa como fallback si el primario falla.',
        storageInfo: 'Prefix: <code style="color:var(--cyan)">sfv1:</code> — exportable a JSON.',
        exportBtn: 'Export JSON', importBtn: 'Import JSON', clearBtn: 'Borrar Todo',
        saveBtn: 'Guardar Configuración', savedAlert: 'Configuración guardada',
        storageUsed: 'Usado:', storageKeys: 'Keys:'
      },
      dataio: {
        imported: 'Importados {{count}} registros',
        error: 'Error:',
        clearConfirm: 'Borrar TODOS los datos locales? No se puede deshacer.'
      },
      debug: { filterPlaceholder: 'Filtrar...' },
      months: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    },

    en: {
      app:   { title: 'Financial Health v1.2' },
      brand: { line1: 'FINANCIAL', line2: 'HEALTH' },
      nav: {
        wealth: 'WEALTH', system: 'SYSTEM',
        investments: 'Investments', properties: 'Properties',
        emergency: 'Emergency Funds', pension: 'Pension Funds',
        networth: 'Net Worth', settings: 'Settings'
      },
      ticker: { label: 'MARKET', refresh: 'Refresh', export: 'Export', import: 'Import' },
      investments: {
        title: 'Investments',
        subtitle: 'Monthly snapshots — performance and allocation suggestions',
        addSnapshot: '+ Snapshot',
        manageFunds: 'Funds',
        monthLabel: 'Month',
        sectionSnapshot: "Month's Snapshot",
        chartHistory: 'History by Fund',
        chartReturn: 'Return (%)',
        modal: {
          titleAdd: 'Record Investment Snapshot',
          titleEdit: 'Edit Snapshot',
          labelMonth: 'Month', labelFund: 'Fund',
          labelPrevBalance: 'Previous Month Balance',
          labelCurrBalance: 'Current Balance',
          labelCurrency: 'Currency',
          labelInvested: 'Invested this month',
          titleFunds: 'Manage Funds',
          labelFundName: 'Name', labelFundCurrency: 'Currency', labelFundDesc: 'Description',
          saveFund: 'Add Fund', updateFund: 'Update Fund', cancelEdit: 'Cancel edit',
          marketIds: 'Market identifiers (optional)',
          labelTicker: 'Ticker', labelIsin: 'ISIN', labelRunCmf: 'CMF RUN',
          labelCusip: 'CUSIP', labelBloomberg: 'Bloomberg Ticker', labelPriceSource: 'Price source',
          helpTicker: 'Stock symbol for ETFs and equities. E.g.: VOO, SPY. Find it on Yahoo Finance or your broker.',
          helpIsin: 'ISO 6166 code, 12 characters. E.g.: IE000JIZVX47. Find it in the fund prospectus or isin.org.',
          helpRunCmf: 'CMF Chile fund RUN. Digits only, 4-6 chars. Find it at cmfchile.cl → Mutual Funds.',
          helpCusip: '9 alphanumeric characters. Identifies US market instruments. Optional.',
          helpBloomberg: 'Bloomberg ticker for internal reference only. Not used in public APIs currently.',
          helpPriceSource: 'API to use for fetching price or performance data. Available options depend on the identifier configured.',
          priceSrcNone: '— No automatic source', priceSrcCmf: 'CMF Chile',
          priceSrcYahoo: 'Yahoo Finance', priceSrcAlpha: 'Alpha Vantage',
          priceSrcMorningstar: 'Morningstar', priceSrcManual: 'Manual',
          previewEmpty: 'Enter balances to see return',
          save: 'Save', cancel: 'Cancel'
        },
        kpi: {
          portfolio: 'Portfolio (CLP)', avgReturn: 'Avg Return',
          invested: 'Invested this month', activeFunds: 'Active funds'
        },
        table: {
          fund: 'Fund', currency: 'Currency', prev: 'Previous',
          curr: 'Current', return: 'Return %', mktGain: 'Mkt gain $', clpEquiv: 'CLP equiv.',
          portPct: '% Port.', invested: 'Invested'
        },
        suggest: {
          title: 'Investment Suggestion',
          savingsTarget: 'Savings target:', invested: 'Invested:', available: 'Available:',
          tableClpFund: 'CLP Fund', tableWeight: 'Current weight', tableSuggest: 'Suggest investing',
          noClpFunds: 'No CLP funds this month to calculate suggestion.',
          configSalary: 'Set salary in Settings to see suggestions.'
        },
        preview: { variation: 'CHANGE', diff: 'DIFFERENCE' },
        empty: {
          noSnaps: 'No snapshots for {{month}}.',
          hint: 'Use ◀ ▶ to navigate or + Snapshot to add.'
        },
        confirm: { deleteSnap: 'Delete snapshot?', deleteFund: 'Delete fund?' },
        livePrices: {
          title: 'Live prices',
          fund: 'Fund', source: 'Source', price: 'Price', change: '1d change',
          loading: 'Refreshing…', noFunds: '',
          stale: 'stale data', refreshTitle: 'Refresh market prices'
        }
      },
      properties: {
        title: 'Properties',
        subtitle: 'Mortgages — Rents — m² Appreciation',
        addProperty: '+ Add', addRent: 'Record Rent', addM2: 'm² Value',
        sectionRents: 'Rent History',
        modal: {
          titleAdd: 'Add Property', titleEdit: 'Edit Property',
          titleAddRent: 'Record Rent', titleEditRent: 'Edit Rent',
          titleAddM2: 'Record m² Value', titleEditM2: 'Edit m² Value',
          labelName: 'Name', labelAddress: 'Address', labelCommune: 'Commune',
          labelUnit: 'Unit', labelSqm: 'm²', labelBeds: 'Beds', labelBaths: 'Baths',
          labelLayout: 'Layout', labelParking: 'Parking', labelStorage: 'Storage',
          mortgageSection: 'Mortgage',
          labelUfPrice: 'Purchase price (UF)', labelUfLoan: 'Loan amount (UF)', labelUfFee: 'Installment (UF)',
          labelTotalInst: 'Total installments', labelPaid: 'Paid',
          labelBank: 'Bank', labelRate: 'Annual rate (%)',
          labelCreditType: 'Credit type', labelNotes: 'Notes',
          labelExtraComm: 'Default extra expenses (CLP)',
          labelProperty: 'Property', labelMonth: 'Month',
          labelRentAmount: 'Rent charged (CLP)',
          labelAdditionalIncome: 'Additional income (CLP)',
          labelDividend: 'Mortgage payment (CLP)', labelCommission: 'Mgmt commission',
          labelOtherExpenses: 'Other expenses (CLP)', labelNetFlow: 'Net flow (auto)',
          labelM2Value: 'm² Value (CLP)',
          save: 'Save', register: 'Register', cancel: 'Cancel', close: 'Close'
        },
        kpi: { count: 'Properties', debtUF: 'UF Debt', netMonth: 'Monthly Net Flow', netYear: 'Annual Net Flow' },
        card: {
          beds: 'BEDS', baths: 'BATHS', parking: 'PARK.', mortgage: 'Mortgage',
          bank: 'Bank:', rate: 'Rate:', fee: 'Payment:', clp: 'CLP:',
          estDebt: 'Est. debt:', appreciation: 'Approx. appreciation:',
          cost: 'Purchase price:', paidSoFar: 'Paid to date:',
          recentRents: 'Recent rents', edit: 'Edit'
        },
        m2Table: { property: 'Property', month: 'Month', value: 'm² Value', noRecords: 'No records' },
        rentTable: {
          property: 'Property', month: 'Month', rent: 'Rent',
          additionalIncome: 'Add. income', dividend: 'Mortgage',
          commission: 'Commission', otherExpenses: 'Other exp.',
          netFlow: 'Net Flow', notes: 'Notes', noRents: 'No rents recorded'
        },
        confirm: { deleteProperty: 'Delete property?', deleteM2: 'Delete m² value record?', deleteRent: 'Delete?' }
      },
      emergency: {
        title: 'Emergency Funds',
        subtitle: 'Reserve funds and financial security goals',
        addFund: '+ Add Fund',
        modal: {
          titleAdd: 'Create Emergency Fund', titleEdit: 'Edit Emergency Fund',
          labelName: 'Fund name', labelDesc: 'Description / Goal',
          labelInvestment: 'Base investment', goalTypeSection: 'Goal Type',
          labelGoalBasis: 'Base category',
          labelGoalValue: 'Number of months', labelGoalValueAmount: 'Amount (CLP)',
          labelNotes: 'Notes (optional)',
          previewEmpty: 'Fill in the fields to see a preview',
          selectInvestment: '-- Select an investment --',
          goalTypeParamMonths: 'Months × parameters',
          goalTypeDivMonths: 'Dividend months',
          goalTypeFixed: 'Fixed amount (CLP)',
          basisNeeds: '% Needs', basisWants: '% Wants', basisSalary: 'Full salary',
          basisNeedsLabel: '% Needs', basisWantsLabel: '% Wants',
          basisSalaryLabel: '100% Full salary',
          perMonth: '/month', paramsInfo: 'Configurable parameters in Settings',
          save: 'Save', cancel: 'Cancel'
        },
        kpi: { totalGoal: 'Total Goal', totalBalance: 'Total Balance', shortfall: 'Shortfall', avgProgress: 'Avg Progress' },
        card: {
          progress: 'Progress', balance: 'BALANCE', goal: 'GOAL', shortfall: 'SHORTFALL',
          edit: 'Edit', unknownInvestment: 'Unknown investment',
          goalLabelMonths: 'months ×', goalLabelDivMonths: 'dividend months', goalLabelFixed: 'fixed',
          basisNeeds: '% needs', basisWants: '% wants', basisSalary: 'full salary'
        },
        empty: { title: 'No emergency funds yet', hint: 'Create one to start tracking your goals' },
        preview: { goal: 'GOAL', balance: 'BALANCE', shortfall: 'SHORTFALL', progress: 'PROGRESS' },
        confirm: { deleteFund: 'Delete this emergency fund?' }
      },
      pension: {
        title: 'Pension Funds',
        subtitle: 'Retirement savings — accumulated balance per fund',
        addFund: '+ Add Fund',
        modal: {
          titleAdd: 'Add Pension Fund', titleEdit: 'Edit Pension Fund',
          labelDesc: 'Description', labelAmount: 'Accumulated balance', labelCurrency: 'Currency',
          save: 'Save', cancel: 'Cancel'
        },
        kpi: { count: 'Funds', total: 'Total', largest: 'Largest fund', currencies: 'Currencies' },
        card: { balance: 'BALANCE', equivalent: 'EQUIVALENT', edit: 'Edit' },
        empty: { title: 'No pension funds yet', hint: 'Add one to start tracking your retirement savings' },
        confirm: { deleteFund: 'Delete this pension fund?' }
      },
      networth: {
        title: 'Net Worth',
        subtitle: 'Estimate based on your investments, pension funds, and properties',
        assetsSection: 'Assets', liabilitiesSection: 'Liabilities',
        totalAssets: 'Total Assets', totalLiabilities: 'Total Liabilities', netWorth: 'Net Worth',
        items: {
          investments: 'Investments', pension: 'Pension Funds',
          properties: 'Properties — Market Value', mortgages: 'Outstanding mortgages'
        },
        sources: { m2: 'm² value', uf: 'UF purchase price' },
        kpi: { assets: 'Assets', liabilities: 'Liabilities', netWorth: 'Net Worth', coverage: 'Coverage' },
        notes: {
          investmentsEmpty: 'No investment snapshots', pensionEmpty: 'No pension funds',
          propertiesEmpty: 'No properties with estimable value', mortgagesEmpty: 'No mortgages recorded'
        }
      },
      settings: {
        title: 'Settings', subtitle: 'Financial parameters — Local data',
        financialSection: 'Financial Parameters', localDataSection: 'Local Data',
        archSection: 'Architecture',
        labelSalary: 'Monthly salary (CLP)', labelNeeds: '% Needs',
        labelWants: '% Wants', labelCommission: 'Property mgmt commission (%)',
        labelPrimaryCurrency: 'Primary currency',
        savings: 'Savings:',
        marketPricesSection: 'Market Prices',
        labelFpTtlShort: 'Quotes cache (min)',
        labelFpTtlLong:  'CMF funds cache (min)',
        labelFpStagger:  'Request delay (ms)',
        labelFpTimeout:  'Connection timeout (s)',
        fpHintTtlShort:  'Time before re-querying Yahoo / Alpha Vantage / Morningstar. Default 15 min.',
        fpHintTtlLong:   'Time before re-querying CMF Chile (publishes once per day). Default 240 min.',
        fpHintStagger:   'Delay between proxy requests to avoid throttling. Default 300 ms.',
        fpHintTimeout:   'Maximum wait time for proxy response. Default 12 s.',
        labelFpProxy1:   'Primary CORS proxy',
        labelFpProxy2:   'Fallback CORS proxy',
        fpHintProxy:     'Proxy the browser uses to bypass CORS restrictions from external APIs. The fallback is tried if the primary fails.',
        storageInfo: 'Prefix: <code style="color:var(--cyan)">sfv1:</code> — exportable to JSON.',
        exportBtn: 'Export JSON', importBtn: 'Import JSON', clearBtn: 'Clear All',
        saveBtn: 'Save Settings', savedAlert: 'Settings saved',
        storageUsed: 'Used:', storageKeys: 'Keys:'
      },
      dataio: {
        imported: 'Imported {{count}} records',
        error: 'Error:',
        clearConfirm: 'Delete ALL local data? This cannot be undone.'
      },
      debug: { filterPlaceholder: 'Filter...' },
      months: ['January','February','March','April','May','June','July','August','September','October','November','December']
    }
  },

  // ── Lookup: dot-notation key, optional {{param}} interpolation ──
  t: function(key, params) {
    var parts = key.split('.');
    var obj = this._data[this.locale] || this._data.es;
    for (var i = 0; i < parts.length; i++) {
      if (obj == null || typeof obj !== 'object') return key;
      obj = obj[parts[i]];
    }
    if (obj == null || typeof obj !== 'string') return key;
    if (!params) return obj;
    return obj.replace(/\{\{(\w+)\}\}/g, function(_, k) { return params[k] != null ? params[k] : '{{' + k + '}}'; });
  },

  // ── Shorthand for month name array in current locale ──
  months: function() {
    return (this._data[this.locale] || this._data.es).months;
  },

  // ── Apply translations to all data-i18n* elements in the DOM ──
  applyAll: function() {
    var self = this;
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.textContent = self.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      el.innerHTML = self.t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = self.t(el.getAttribute('data-i18n-placeholder'));
    });
    document.title = this.t('app.title');
    this._updateToggleBtn();
  },

  // ── Switch locale, persist, and re-render everything ──
  setLocale: function(lang) {
    if (lang !== 'es' && lang !== 'en') return;
    this.locale = lang;
    localStorage.setItem('sfv1:lang', lang);
    document.documentElement.lang = lang;
    this.applyAll();
    // Re-render the currently active view
    var active = document.querySelector('.view.active');
    if (active) {
      var view = active.id.replace('view-', '');
      if (view === 'investments' && typeof Investments !== 'undefined') Investments.renderAll();
      else if (view === 'properties'  && typeof Properties    !== 'undefined') Properties.renderAll();
      else if (view === 'emergency'   && typeof EmergencyFunds !== 'undefined') EmergencyFunds.renderAll();
      else if (view === 'pension'     && typeof PensionFunds   !== 'undefined') PensionFunds.renderAll();
      else if (view === 'networth'    && typeof NetWorth       !== 'undefined') NetWorth.renderAll();
      else if (view === 'settings'    && typeof Settings       !== 'undefined') Settings.load();
    }
    if (typeof MarketData    !== 'undefined') MarketData._render();
    if (typeof MonthPicker   !== 'undefined') MonthPicker.refreshAll();
  },

  toggle: function() { this.setLocale(this.locale === 'es' ? 'en' : 'es'); },

  _updateToggleBtn: function() {
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = this.locale === 'es' ? 'EN' : 'ES';
  }
};

// ── Bootstrap: read persisted locale before any rendering ──
(function() {
  var saved = localStorage.getItem('sfv1:lang');
  var sys = ((navigator.language || 'es').slice(0, 2)).toLowerCase();
  I18n.locale = saved || (sys === 'en' ? 'en' : 'es');
  document.documentElement.lang = I18n.locale;
})();
