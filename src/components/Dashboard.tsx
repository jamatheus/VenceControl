import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { differenceInMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LogOut, Plus, PackageOpen, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import NewBatchModal from './NewBatchModal';

interface Batch {
  id: string;
  nombre_producto: string;
  numero_lote: string;
  fecha_vencimiento: string;
  registrado_por: string;
  id_usuario: string;
  fecha_registro: string;
}

export default function Dashboard({ session }: { session: any }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      console.error('Error fetching batches:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const confirmDelete = async () => {
    if (!batchToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('batches').delete().eq('id', batchToDelete);
      if (error) throw error;
      fetchBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error.message);
    } finally {
      setIsDeleting(false);
      setBatchToDelete(null);
    }
  };

  /**
   * Lógica de Semáforo para el color de fondo de la fila.
   * Calcula la diferencia en meses entre la fecha de vencimiento y la fecha actual.
   * - Rojo (<= 3 meses): Vencimiento crítico
   * - Amarillo (> 3 y <= 6 meses): Vencimiento próximo
   * - Verde/Neutro (> 6 meses): Vencimiento lejano
   */
  const getRowColor = (expirationDateStr: string) => {
    const expirationDate = parseISO(expirationDateStr);
    const currentDate = new Date();
    
    // Calcula la diferencia en meses completos
    const monthsDiff = differenceInMonths(expirationDate, currentDate);

    if (monthsDiff <= 3) {
      return 'bg-red-50 hover:bg-red-100 text-red-900 border-l-4 border-red-500';
    } else if (monthsDiff > 3 && monthsDiff <= 6) {
      return 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900 border-l-4 border-yellow-500';
    } else {
      return 'bg-green-50 hover:bg-green-100 text-green-900 border-l-4 border-green-500';
    }
  };

  const getStatusIcon = (expirationDateStr: string) => {
    const expirationDate = parseISO(expirationDateStr);
    const currentDate = new Date();
    const monthsDiff = differenceInMonths(expirationDate, currentDate);

    if (monthsDiff <= 3) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (monthsDiff <= 6) return <Clock className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <PackageOpen className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-slate-800">VenceControl</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 hidden sm:block">
                Hola, {session.user.user_metadata?.display_name || session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-500 hover:text-slate-700 focus:outline-none transition"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard de Inventario</h2>
            <p className="text-sm text-slate-500 mt-1">
              Monitorea las fechas de vencimiento de tus productos.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Nuevo Ingreso
          </button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-slate-600">Crítico (≤ 3 meses)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-slate-600">Próximo (3 - 6 meses)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-slate-600">Lejano (&gt; 6 meses)</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Lote
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Registrado Por
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Cargando inventario...
                    </td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No hay productos registrados. Haz clic en "Nuevo Ingreso" para comenzar.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id} className={`${getRowColor(batch.fecha_vencimiento)} transition-colors`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusIcon(batch.fecha_vencimiento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {batch.nombre_producto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                        {batch.numero_lote}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {format(parseISO(batch.fecha_vencimiento), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {batch.registrado_por}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm opacity-75">
                        {format(parseISO(batch.fecha_registro), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setBatchToDelete(batch.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <NewBatchModal
          session={session}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchBatches();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                    Eliminar Registro
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      ¿Estás seguro de que deseas eliminar este producto del inventario? Esta acción no se puede deshacer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                onClick={() => setBatchToDelete(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50"
                onClick={confirmDelete}
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
