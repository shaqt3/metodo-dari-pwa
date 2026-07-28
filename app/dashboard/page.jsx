'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { 
  Dumbbell, UtensilsCrossed, Trophy, TrendingUp, 
  ChevronRight, Flame, Clock, Plus,
  ArrowLeft, BookOpen, Camera, CheckCircle
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-purple-400">El Método Dari</h1>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'home' && <HomeTab setActiveTab={setActiveTab} />}
        {activeTab === 'exercises' && <ExercisesTab />}
        {activeTab === 'routines' && <RoutinesTab />}
        {activeTab === 'nutrition' && <NutritionTab />}
        {activeTab === 'progress' && <ProgressTab userId={user?.id} />}
        {activeTab === 'challenges' && <ChallengesTab userId={user?.id} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-40">
        <div className="max-w-4xl mx-auto flex justify-around py-2">
          {[
            { id: 'home', icon: '🏠', label: 'Inicio' },
            { id: 'exercises', icon: '💪', label: 'Ejercicios' },
            { id: 'routines', icon: '📋', label: 'Rutinas' },
            { id: 'nutrition', icon: '🥗', label: 'Dieta' },
            { id: 'progress', icon: '📊', label: 'Progreso' },
            { id: 'challenges', icon: '🏆', label: 'Retos' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-1 rounded-lg transition ${
                activeTab === tab.id ? 'text-purple-400' : 'text-gray-500'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

// HOME TAB
function HomeTab({ setActiveTab }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">¡Bienvenido!</h2>
        <p className="text-gray-400">Tu plataforma completa de entrenamiento</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => setActiveTab('exercises')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-purple-500 transition">
          <Dumbbell className="text-purple-400 mb-2" size={24} />
          <h3 className="font-semibold">Ejercicios</h3>
          <p className="text-gray-400 text-xs">+50 con explicación</p>
        </button>
        <button onClick={() => setActiveTab('routines')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-purple-500 transition">
          <BookOpen className="text-blue-400 mb-2" size={24} />
          <h3 className="font-semibold">Rutinas</h3>
          <p className="text-gray-400 text-xs">20 predefinidas</p>
        </button>
        <button onClick={() => setActiveTab('nutrition')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-purple-500 transition">
          <UtensilsCrossed className="text-green-400 mb-2" size={24} />
          <h3 className="font-semibold">Nutrición</h3>
          <p className="text-gray-400 text-xs">10 dietas con macros</p>
        </button>
        <button onClick={() => setActiveTab('challenges')} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-purple-500 transition">
          <Trophy className="text-yellow-400 mb-2" size={24} />
          <h3 className="font-semibold">Retos</h3>
          <p className="text-gray-400 text-xs">¡Levanta un coche!</p>
        </button>
      </div>
    </div>
  );
}

// EXERCISES TAB
function ExercisesTab() {
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercise_library')
      .select('*')
      .order('name');
    
    if (error) console.error('Error:', error);
    else setExercises(data || []);
    setLoading(false);
  };

  const muscleGroups = ['Todos', ...new Set(exercises.map(e => e.muscle_group))];
  const filtered = filter === 'Todos' ? exercises : exercises.filter(e => e.muscle_group === filter);

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="flex items-center text-purple-400">
          <ArrowLeft size={20} className="mr-2" /> Volver
        </button>
        
        <h2 className="text-2xl font-bold">{selected.name}</h2>
        
        <div className="flex gap-2 flex-wrap">
          <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">{selected.muscle_group}</span>
          <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">{selected.equipment}</span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            selected.difficulty === 'principiante' ? 'bg-green-600' :
            selected.difficulty === 'intermedio' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>{selected.difficulty}</span>
        </div>

        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
            <BookOpen size={20} /> Cómo hacer este ejercicio
          </h3>
          
          {selected.description ? (
            <div className="space-y-3">
              {selected.description.split('\n').map((line, i) => {
                if (line.startsWith('POSICIÓN INICIAL:')) {
                  return (
                    <div key={i} className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
                      <span className="text-blue-400 font-bold">📍 POSICIÓN INICIAL:</span>
                      <p className="text-gray-300 mt-1">{line.replace('POSICIÓN INICIAL:', '').trim()}</p>
                    </div>
                  );
                }
                if (line.startsWith('MOVIMIENTO:')) {
                  return (
                    <div key={i} className="bg-green-900/30 border border-green-700 rounded-lg p-3">
                      <span className="text-green-400 font-bold">🔄 MOVIMIENTO:</span>
                      <p className="text-gray-300 mt-1">{line.replace('MOVIMIENTO:', '').trim()}</p>
                    </div>
                  );
                }
                if (line.startsWith('RESPIRACIÓN:')) {
                  return (
                    <div key={i} className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-3">
                      <span className="text-cyan-400 font-bold"> RESPIRACIÓN:</span>
                      <p className="text-gray-300 mt-1">{line.replace('RESPIRACIÓN:', '').trim()}</p>
                    </div>
                  );
                }
                if (line.startsWith('ERRORES COMUNES:')) {
                  return (
                    <div key={i} className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                      <span className="text-red-400 font-bold">⚠️ ERRORES COMUNES:</span>
                      <p className="text-gray-300 mt-1">{line.replace('ERRORES COMUNES:', '').trim()}</p>
                    </div>
                  );
                }
                if (line.startsWith('MÚSCULOS:')) {
                  return (
                    <div key={i} className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
                      <span className="text-purple-400 font-bold">🎯 MÚSCULOS:</span>
                      <p className="text-gray-300 mt-1">{line.replace('MÚSCULOS:', '').trim()}</p>
                    </div>
                  );
                }
                return line.trim() ? <p key={i} className="text-gray-300">{line}</p> : null;
              })}
            </div>
          ) : (
            <p className="text-gray-400">Descripción no disponible.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Biblioteca de Ejercicios</h2>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        {muscleGroups.map(group => (
          <button
            key={group}
            onClick={() => setFilter(group)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
              filter === group ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => setSelected(exercise)}
              className="w-full bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-purple-500 transition flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{exercise.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-gray-400">{exercise.muscle_group}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-400">{exercise.equipment}</span>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-500" />
            </button>
          ))}
          <p className="text-gray-500 text-sm text-center">{filtered.length} ejercicios</p>
        </div>
      )}
    </div>
  );
}

// ROUTINES TAB
function RoutinesTab() {
  const [routines, setRoutines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutines();
  }, []);

  const loadRoutines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .order('name');
    
    if (error) console.error('Error:', error);
    else setRoutines(data || []);
    setLoading(false);
  };

  const loadRoutineExercises = async (routineId) => {
    const { data, error } = await supabase
      .from('routine_exercises')
      .select(`
        *,
        exercise_library (name, muscle_group, equipment, difficulty, description)
      `)
      .eq('routine_id', routineId)
      .order('order_index');
    
    if (error) console.error('Error:', error);
    else setExercises(data || []);
  };

  const selectRoutine = async (routine) => {
    setSelected(routine);
    await loadRoutineExercises(routine.id);
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setSelected(null); setExercises([]); }} className="flex items-center text-purple-400">
          <ArrowLeft size={20} className="mr-2" /> Volver
        </button>
        
        <h2 className="text-2xl font-bold">{selected.name}</h2>
        <p className="text-gray-400">{selected.description}</p>
        
        <div className="flex gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${
            selected.difficulty === 'principiante' ? 'bg-green-600' :
            selected.difficulty === 'intermedio' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>{selected.difficulty}</span>
          <span className="bg-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <Clock size={14} /> {selected.duration_minutes} min
          </span>
        </div>

        <div className="space-y-3 mt-4">
          {exercises.map((re, index) => (
            <div key={re.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-purple-400 text-sm font-mono">{index + 1}.</span>
                  <h3 className="font-semibold inline ml-2">{re.exercise_library?.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {re.exercise_library?.muscle_group} • {re.exercise_library?.equipment}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{re.sets} × {re.reps}</p>
                  <p className="text-gray-500 text-xs">{re.rest_seconds}s descanso</p>
                </div>
              </div>
              {re.exercise_library?.description && (
                <details className="mt-2">
                  <summary className="text-purple-400 text-sm cursor-pointer">📖 Ver cómo se hace</summary>
                  <div className="mt-2 text-gray-300 text-sm whitespace-pre-line bg-gray-900 rounded-lg p-3">
                    {re.exercise_library.description}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Rutinas Predefinidas</h2>
      <p className="text-gray-400">20 rutinas listas para usar</p>
      
      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="space-y-3">
          {routines.map(routine => (
            <button
              key={routine.id}
              onClick={() => selectRoutine(routine)}
              className="w-full bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-purple-500 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{routine.name}</h3>
                  <p className="text-gray-400 text-sm">{routine.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      routine.difficulty === 'principiante' ? 'bg-green-600/30 text-green-400' :
                      routine.difficulty === 'intermedio' ? 'bg-yellow-600/30 text-yellow-400' : 'bg-red-600/30 text-red-400'
                    }`}>{routine.difficulty}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {routine.duration_minutes} min
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-500" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// NUTRITION TAB
function NutritionTab() {
  const [subTab, setSubTab] = useState('foods');
  const [foods, setFoods] = useState([]);
  const [diets, setDiets] = useState([]);
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [foodFilter, setFoodFilter] = useState('Todos');

  useEffect(() => {
    loadFoods();
    loadDiets();
  }, []);

  const loadFoods = async () => {
    const { data } = await supabase.from('foods').select('*').order('name');
    if (data) setFoods(data);
  };

  const loadDiets = async () => {
    const { data } = await supabase.from('diets').select('*').order('name');
    if (data) setDiets(data);
    setLoading(false);
  };

  const loadDietMeals = async (dietId) => {
    const { data } = await supabase
      .from('meals')
      .select(`
        *,
        meal_foods (
          quantity,
          unit,
          foods (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
        )
      `)
      .eq('diet_plan_id', dietId)
      .order('time');
    
    if (data) setMeals(data);
  };

  const selectDiet = async (diet) => {
    setSelectedDiet(diet);
    await loadDietMeals(diet.id);
  };

  const categories = ['Todos', ...new Set(foods.map(f => f.category))];
  const filteredFoods = foodFilter === 'Todos' ? foods : foods.filter(f => f.category === foodFilter);

  if (loading) {
    return <p className="text-gray-400">Cargando nutrición...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Nutrición</h2>
      
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-sm">
        <p>📊 Alimentos: <strong>{foods.length}</strong></p>
        <p>📊 Dietas: <strong>{diets.length}</strong></p>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => setSubTab('foods')} 
          className={`px-4 py-2 rounded-lg ${subTab === 'foods' ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
           Alimentos ({foods.length})
        </button>
        <button 
          onClick={() => setSubTab('diets')} 
          className={`px-4 py-2 rounded-lg ${subTab === 'diets' ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          📋 Dietas ({diets.length})
        </button>
      </div>

      {subTab === 'foods' && (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFoodFilter(cat)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                  foodFilter === cat ? 'bg-green-600' : 'bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredFoods.map(food => (
            <div key={food.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{food.name}</h3>
                  <span className="text-xs text-gray-500">{food.category}</span>
                </div>
                <span className="text-purple-400 font-bold">{food.calories_per_100g} kcal</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="bg-red-900/20 rounded-lg p-2 text-center">
                  <p className="text-red-400 font-bold text-sm">{food.protein_per_100g}g</p>
                  <p className="text-gray-500 text-[10px]">Proteína</p>
                </div>
                <div className="bg-yellow-900/20 rounded-lg p-2 text-center">
                  <p className="text-yellow-400 font-bold text-sm">{food.carbs_per_100g}g</p>
                  <p className="text-gray-500 text-[10px]">Carbos</p>
                </div>
                <div className="bg-blue-900/20 rounded-lg p-2 text-center">
                  <p className="text-blue-400 font-bold text-sm">{food.fat_per_100g}g</p>
                  <p className="text-gray-500 text-[10px]">Grasas</p>
                </div>
                <div className="bg-green-900/20 rounded-lg p-2 text-center">
                  <p className="text-green-400 font-bold text-sm">{food.fiber_per_100g}g</p>
                  <p className="text-gray-500 text-[10px]">Fibra</p>
                </div>
              </div>
              <p className="text-gray-600 text-[10px] mt-2 text-right">por cada 100g</p>
            </div>
          ))}
        </div>
      )}

      {subTab === 'diets' && (
        <div className="space-y-3">
          {diets.map(diet => (
            <button
              key={diet.id}
              onClick={() => selectDiet(diet)}
              className="w-full bg-gray-800 rounded-xl p-4 border border-gray-700 text-left hover:border-green-500 transition"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{diet.name}</h3>
                  <p className="text-gray-400 text-sm">{diet.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{diet.daily_calories}</p>
                  <p className="text-gray-500 text-xs">kcal/día</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// PROGRESS TAB
function ProgressTab({ userId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    calories_burned: '',
    notes: ''
  });

  useEffect(() => {
    if (userId) loadLogs();
  }, [userId]);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(50);

    if (data) setLogs(data);
    setLoading(false);
  };

  const saveLog = async () => {
    if (!formData.duration_minutes) return;

    const { error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        date: formData.date,
        duration_minutes: parseInt(formData.duration_minutes),
        calories_burned: formData.calories_burned ? parseInt(formData.calories_burned) : null,
        notes: formData.notes || null
      });

    if (error) {
      alert('Error: ' + error.message);
    } else {
      setShowForm(false);
      setFormData({ date: new Date().toISOString().split('T')[0], duration_minutes: '', calories_burned: '', notes: '' });
      await loadLogs();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mi Progreso</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg flex items-center gap-1 text-sm">
          <Plus size={16} /> Registrar
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-4 border border-purple-500 space-y-3">
          <h3 className="font-semibold">Nuevo Entrenamiento</h3>
          <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2" />
          <input type="number" placeholder="Duración (min)" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2" />
          <input type="number" placeholder="Calorías quemadas" value={formData.calories_burned} onChange={e => setFormData({...formData, calories_burned: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2" />
          <textarea placeholder="Notas" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2" rows={2} />
          <button onClick={saveLog} className="w-full bg-green-600 hover:bg-green-500 py-2 rounded-lg font-semibold">Guardar</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : logs.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
          <TrendingUp size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">Aún no tienes registros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{log.date}</p>
                  <p className="text-gray-400 text-sm">{log.notes || 'Sin notas'}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-400 font-bold">{log.duration_minutes} min</p>
                  {log.calories_burned && <p className="text-orange-400 text-sm">{log.calories_burned} kcal</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChallengesTab({ userId }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    console.log('🔍 Cargando retos desde Supabase...');
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('target_value');
    
    console.log('📦 Retos cargados:', data?.length);
    console.log(' Error:', error);
    
    if (data) setChallenges(data);
    setLoading(false);
  };

  const getEmoji = (type) => {
    switch(type) {
      case 'weight': return '🏋️';
      case 'distance': return '🏃';
      case 'consistency': return '🔥';
      case 'reps': return '💪';
      case 'calories': return '🔥';
      case 'workouts': return '';
      case 'elevation': return '️';
      default: return '';
    }
  };

  if (loading) {
    return <p className="text-gray-400">Cargando retos...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Retos Épicos</h2>
      <p className="text-gray-400">¿Has levantado un coche? ¿Un camión? ¿Una ballena blanca?</p>
      
      {challenges.length === 0 ? (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
          <p className="text-yellow-400">️ No hay retos cargados</p>
          <p className="text-gray-400 text-sm mt-2">Verifica la consola (F12) para ver errores</p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map(challenge => (
            <div key={challenge.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{getEmoji(challenge.type)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{challenge.name}</h3>
                  <p className="text-gray-400 text-sm">{challenge.description}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-purple-400 text-sm font-bold">
                      {challenge.target_value.toLocaleString()} {challenge.unit}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {challenge.duration_days} días
                    </span>
                  </div>
                  {challenge.motivation_message && (
                    <p className="text-yellow-400 text-xs mt-2 italic">
                      🏆 "{challenge.motivation_message}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}