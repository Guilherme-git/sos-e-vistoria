/**
 * Mapeamento de tipos de serviço (service_type) para labels em PT-BR
 *
 * Categorias:
 * - Guincho (Towing): 8 tipos
 * - Bateria (Battery): 6 tipos
 * - Pneu (Tire): 4 tipos
 * - Chaveiro (Locksmith): 4 tipos
 * - Combustível (Fuel): 2 tipos
 * - Outros: 2 tipos
 */

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  // 🚛 GUINCHO (TOWING) - 8 tipos
  'towing': 'Guincho',
  'towing_light': 'Guincho Leve',
  'towing_moto': 'Guincho Moto',
  'towing_heavy': 'Guincho Pesado',
  'towing_extra_heavy': 'Guincho Extra Pesado',
  'towing_utility': 'Guincho Utilitário',
  'towing_locavibe': 'Guincho Locavibe',
  'towing_breakdown': 'Guincho por Pane',

  // 🔋 BATERIA (BATTERY) - 6 tipos
  'battery': 'Bateria',
  'battery_charge_light': 'Carga de Bateria Leve',
  'battery_charge_moto': 'Carga de Bateria Moto',
  'battery_charge_heavy': 'Carga de Bateria Pesado',
  'battery_charge_utility': 'Carga de Bateria Utilitário',
  'battery_replacement': 'Troca de Bateria',

  // 🛞 PNEU (TIRE) - 4 tipos
  'tire_change': 'Troca de Pneu',
  'tire_change_light': 'Troca de Pneu Leve',
  'tire_change_heavy': 'Troca de Pneu Pesado',
  'tire_change_utility': 'Troca de Pneu Utilitário',

  // 🔑 CHAVEIRO (LOCKSMITH) - 4 tipos
  'locksmith': 'Chaveiro',
  'locksmith_automotive_imported': 'Chaveiro Automotivo Importado',
  'locksmith_automotive_national': 'Chaveiro Automotivo Nacional',
  'locksmith_residential': 'Chaveiro Residencial',

  // ⛽ COMBUSTÍVEL (FUEL) - 2 tipos
  'empty_tank': 'Tanque Vazio',
  'fuel_assistance': 'Assistência Combustível',

  // 🔧 OUTROS SERVIÇOS - 2 tipos
  'reserve_car': 'Carro Reserva',
  'other': 'Outro',
};

/**
 * Converte o service_type do WebSocket para o label em português
 * @param serviceType - Tipo de serviço do banco (ex: "towing", "battery_charge_light")
 * @returns Label em PT-BR (ex: "Guincho", "Carga de Bateria Leve")
 */
export function getServiceTypeLabel(serviceType: string): string {
  return SERVICE_TYPE_LABELS[serviceType] || 'Serviço não identificado';
}

/**
 * Retorna o ícone correspondente ao tipo de serviço
 * @param serviceType - Tipo de serviço do banco
 * @returns Nome do ícone do MaterialIcons
 */
export function getServiceTypeIcon(serviceType: string): string {
  if (serviceType.startsWith('towing')) return 'local-shipping';
  if (serviceType.startsWith('battery')) return 'battery-charging-full';
  if (serviceType.startsWith('tire')) return 'tire-repair';
  if (serviceType.startsWith('locksmith')) return 'vpn-key';
  if (serviceType.startsWith('empty_tank') || serviceType.startsWith('fuel')) return 'local-gas-station';
  if (serviceType === 'reserve_car') return 'directions-car';
  return 'build'; // Ícone genérico para "other"
}
