function EmptyState() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-16 text-center">

      <h2 className="text-3xl font-bold mb-4">
        📋 No Tasks Yet
      </h2>

      <p className="text-gray-500">
        Click "Add Task" to create your first task.
      </p>

    </div>
  );
}

export default EmptyState;