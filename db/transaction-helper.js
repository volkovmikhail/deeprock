const db = require('./database');

/**
 * Выполняет callback в транзакции с указанным уровнем изоляции
 * @param {(connection: import('mysql2').PoolConnection) => Promise<T>} callback - функция, принимающая mysql2 Connection
 * @param {string} [isolationLevel='REPEATABLE READ'] - уровень изоляции транзакции REPEATABLE READ mysql default
 * @returns {Promise<T>} результат выполнения callback
 * @template T
 */
async function withTransaction(callback, isolationLevel = 'REPEATABLE READ') {
  const connection = await db.getConnection();

  try {
    // Устанавливаем уровень изоляции
    await connection.execute(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);

    // Начинаем транзакцию
    await connection.beginTransaction();

    // Выполняем callback с connection
    const result = await callback(connection);

    // Подтверждаем транзакцию
    await connection.commit();

    return result;

  } catch (error) {
    // Откатываем при ошибке
    await connection.rollback();
    throw error;
  } finally {
    // Всегда освобождаем соединение
    connection.release();
  }
}

module.exports = {
  withTransaction
};
