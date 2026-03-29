import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save } from 'lucide-react';

interface NewBatchModalProps {
  session: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewBatchModal({ session, onClose, onSuccess }: NewBatchModalProps) {
  const [loading, setLoading] = useState(false);
  const [nombreProducto, setNombreProducto] = useState('');
  const [numeroLote, setNumeroLote] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar que la fecha sea correcta
      let isoDate = '';
      try {
        isoDate = new Date(fechaVencimiento).toISOString();
      } catch (dateError) {
        throw new Error('La fecha de vencimiento ingresada no es válida.');
      }

      const payload = {
        nombre_producto: nombreProducto,
        numero_lote: numeroLote,
        fecha_vencimiento: isoDate,
        registrado_por: session?.user?.user_metadata?.display_name || session?.user?.email || 'Usuario',
        id_usuario: session?.user?.id,
      };

      console.log('Enviando datos a Supabase:', payload);

      const { data, error } = await supabase
        .from('batches')
        .insert([payload])
        .select(); // Agregamos .select() para asegurar que devuelva el registro insertado

      if (error) {
        console.error('Error de Supabase al insertar:', error);
        // Manejo específico de errores comunes
        if (error.code === '42501') {
          throw new Error('Error de permisos. Asegúrate de haber ejecutado el script SQL de Políticas (RLS) en Supabase.');
        }
        if (error.code === '42P01') {
          throw new Error('La tabla "batches" no existe. Asegúrate de haber ejecutado el script SQL en Supabase.');
        }
        throw new Error(error.message);
      }

      console.log('Registro guardado con éxito:', data);
      onSuccess();
    } catch (err: any) {
      console.error('Error en handleSubmit:', err);
      setError(err.message || 'Error al guardar el registro. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900" id="modal-title">
            Nuevo Ingreso de Inventario
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
          >
            <span className="sr-only">Cerrar</span>
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="nombreProducto" className="block text-sm font-medium text-slate-700">
                Nombre del Producto
              </label>
              <input
                type="text"
                name="nombreProducto"
                id="nombreProducto"
                required
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3 border"
                value={nombreProducto}
                onChange={(e) => setNombreProducto(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="numeroLote" className="block text-sm font-medium text-slate-700">
                Número de Lote
              </label>
              <input
                type="text"
                name="numeroLote"
                id="numeroLote"
                required
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3 border"
                value={numeroLote}
                onChange={(e) => setNumeroLote(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="fechaVencimiento" className="block text-sm font-medium text-slate-700">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                name="fechaVencimiento"
                id="fechaVencimiento"
                required
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-slate-300 rounded-md py-2 px-3 border"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
              >
                {loading ? (
                  'Guardando...'
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Guardar Registro
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
