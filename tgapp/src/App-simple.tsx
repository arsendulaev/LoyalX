// Простая версия для проверки что React работает
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">
          LoyalX работает! 🎉
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-700 mb-4">
            Если ты видишь этот текст, значит React работает правильно!
          </p>
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ Vite запущен<br/>
            ✅ React загружен<br/>
            ✅ Tailwind CSS работает
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
