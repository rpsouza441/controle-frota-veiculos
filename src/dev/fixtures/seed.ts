/**
 * @dev FIXTURES DE DESENVOLVIMENTO — NÃO IMPORTAR EM CÓDIGO DE PRODUÇÃO
 *
 * Este arquivo contém dados iniciais usados apenas para referência local e
 * eventual uso em testes automatizados futuros (ex: Vitest/Jest com mocks).
 *
 * O frontend de produção NUNCA deve importar este arquivo.
 * Todos os dados de runtime vêm exclusivamente da API (/api/*) → MariaDB.
 *
 * Para popular o banco de dados use: npm run db:seed
 */
import { FleetState } from "../../domain/types";

export const initialFleetState: FleetState = {
  teams: [
    { id: "team-sales", name: "Comercial", active: true },
    { id: "team-ops", name: "Operações", active: true },
    { id: "team-admin", name: "Administrativo", active: true },
  ],
  users: [
    { id: "u-employee", name: "Ricardo Lima", email: "ricardo@empresa.com.br", role: "EMPLOYEE", teamId: "team-sales", active: true },
    { id: "u-employee-2", name: "Marina Costa", email: "marina@empresa.com.br", role: "EMPLOYEE", teamId: "team-ops", active: true },
    { id: "u-manager", name: "Patricia Rocha", email: "patricia@empresa.com.br", role: "MANAGER", teamId: "team-ops", active: true },
    { id: "u-admin", name: "Admin Frota", email: "admin@empresa.com.br", role: "ADMIN", teamId: "team-admin", active: true },
    { id: "u-inactive", name: "Usuario Inativo", email: "inativo@empresa.com.br", role: "EMPLOYEE", teamId: "team-sales", active: false },
  ],
  vehicles: [
    { id: "v-1", plate: "BRA2E19", model: "Fiat Strada Volcano", currentKm: 42810, teamId: "team-sales", status: "DISPONIVEL", active: true },
    { id: "v-2", plate: "RJO8A44", model: "Chevrolet Onix Plus", currentKm: 31540, teamId: "team-sales", status: "DISPONIVEL", active: true },
    { id: "v-3", plate: "SPQ5D72", model: "Toyota Corolla XEi", currentKm: 58720, teamId: "team-ops", status: "DISPONIVEL", active: true },
    { id: "v-4", plate: "MGS1C03", model: "Renault Duster", currentKm: 22490, teamId: "team-ops", status: "EM_USO", active: true },
    { id: "v-5", plate: "BHZ9F61", model: "VW Saveiro Robust", currentKm: 73420, teamId: "team-admin", status: "DISPONIVEL", active: true },
    { id: "v-6", plate: "ABC1D23", model: "Ford Ka", currentKm: 90110, teamId: "team-sales", status: "INATIVO", active: false },
  ],
  clients: [
    { id: "c-1", name: "Mercado Central Matriz", active: true },
    { id: "c-2", name: "Clinica Sao Lucas", active: true },
    { id: "c-3", name: "Construtora Horizonte", active: true },
    { id: "c-4", name: "Distribuidora Nova Rota", active: true },
  ],
  usages: [
    {
      id: "usage-1",
      vehicleId: "v-3",
      userId: "u-employee-2",
      teamId: "team-ops",
      clientIds: ["c-3"],
      clientNames: ["Construtora Horizonte"],
      origin: "Sede",
      destination: "Obra Zona Sul",
      purpose: "Visita tecnica",
      withdrawalKm: 58410,
      withdrawalAt: "2026-04-20T08:30",
      returnKm: 58720,
      returnAt: "2026-04-20T17:10",
      returnNote: "Sem ocorrencias.",
      status: "FECHADO",
    },
    {
      id: "usage-2",
      vehicleId: "v-4",
      userId: "u-manager",
      teamId: "team-ops",
      clientIds: ["c-4"],
      clientNames: ["Distribuidora Nova Rota"],
      origin: "Sede",
      destination: "CD Norte",
      purpose: "Auditoria operacional",
      withdrawalKm: 22490,
      withdrawalAt: "2026-04-24T08:15",
      status: "ABERTO",
    },
  ],
  correctionRequests: [
    {
      id: "corr-1",
      vehicleId: "v-2",
      requestedByUserId: "u-employee",
      informedKm: 31582,
      systemKm: 31540,
      reason: "Painel indica quilometragem superior apos uso anterior.",
      status: "PENDENTE",
      createdAt: "2026-04-23T15:35",
    },
  ],
  auditLogs: [
    {
      id: "audit-1",
      createdAt: "2026-04-20T17:10",
      actorUserId: "u-employee-2",
      action: "VEHICLE_RETURN",
      entity: "VehicleUsage",
      summary: "Devolucao do veiculo SPQ5D72 com KM 58720.",
    },
  ],
  settings: {
    employeesCanSeeInUseVehicles: false,
    corporateEmailDomain: "@empresa.com.br",
    footerBrandLabel: "Espaço para sua marca",
  },
};
