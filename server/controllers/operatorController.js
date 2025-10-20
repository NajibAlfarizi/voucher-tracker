import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all operators
export const getAllOperators = async (req, res) => {
  try {
    const operators = await prisma.operator.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' }
    });
    
    res.json({
      success: true,
      data: operators
    });
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching operators',
      error: error.message
    });
  }
};

// Create new operator
export const createOperator = async (req, res) => {
  try {
    const { nama } = req.body;
    
    if (!nama) {
      return res.status(400).json({
        success: false,
        message: 'Nama operator harus diisi'
      });
    }
    
    // Generate kode otomatis dari nama
    const kode = nama.toUpperCase().replace(/\s+/g, '').substring(0, 10);
    
    const operator = await prisma.operator.create({
      data: {
        nama,
        kode,
        aktif: true
      }
    });
    
    res.json({
      success: true,
      data: operator,
      message: 'Operator berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating operator:', error);
    
    // Handle unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Nama atau kode operator sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating operator',
      error: error.message
    });
  }
};

// Update operator
export const updateOperator = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kode, aktif } = req.body;
    
    const operator = await prisma.operator.update({
      where: { id: parseInt(id) },
      data: {
        nama,
        kode,
        aktif
      }
    });
    
    res.json({
      success: true,
      data: operator,
      message: 'Operator berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating operator:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Operator tidak ditemukan'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Nama atau kode operator sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating operator',
      error: error.message
    });
  }
};

// Delete operator (soft delete by setting aktif = false)
export const deleteOperator = async (req, res) => {
  try {
    const { id } = req.params;
    
    const operator = await prisma.operator.update({
      where: { id: parseInt(id) },
      data: { aktif: false }
    });
    
    res.json({
      success: true,
      data: operator,
      message: 'Operator berhasil dinonaktifkan'
    });
  } catch (error) {
    console.error('Error deleting operator:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Operator tidak ditemukan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting operator',
      error: error.message
    });
  }
};