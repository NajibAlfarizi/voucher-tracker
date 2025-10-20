import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all wallet types
export const getAllWalletTypes = async (req, res) => {
  try {
    const walletTypes = await prisma.walletType.findMany({
      where: { aktif: true },
      orderBy: { nama: 'asc' }
    });
    
    res.json({
      success: true,
      data: walletTypes
    });
  } catch (error) {
    console.error('Error fetching wallet types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching wallet types',
      error: error.message
    });
  }
};

// Create new wallet type
export const createWalletType = async (req, res) => {
  try {
    const { nama, nomor_hp } = req.body;
    
    if (!nama) {
      return res.status(400).json({
        success: false,
        message: 'Nama wallet harus diisi'
      });
    }
    
    const walletType = await prisma.walletType.create({
      data: {
        nama,
        nomor_hp: nomor_hp || null,
        aktif: true
      }
    });
    
    res.json({
      success: true,
      data: walletType,
      message: 'Wallet type berhasil ditambahkan'
    });
  } catch (error) {
    console.error('Error creating wallet type:', error);
    
    // Handle unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Nama wallet sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating wallet type',
      error: error.message
    });
  }
};

// Update wallet type
export const updateWalletType = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, nomor_hp, aktif } = req.body;
    
    const walletType = await prisma.walletType.update({
      where: { id: parseInt(id) },
      data: {
        nama,
        nomor_hp,
        aktif
      }
    });
    
    res.json({
      success: true,
      data: walletType,
      message: 'Wallet type berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating wallet type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Wallet type tidak ditemukan'
      });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Nama wallet sudah digunakan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating wallet type',
      error: error.message
    });
  }
};

// Delete wallet type (soft delete by setting aktif = false)
export const deleteWalletType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const walletType = await prisma.walletType.update({
      where: { id: parseInt(id) },
      data: { aktif: false }
    });
    
    res.json({
      success: true,
      data: walletType,
      message: 'Wallet type berhasil dinonaktifkan'
    });
  } catch (error) {
    console.error('Error deleting wallet type:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Wallet type tidak ditemukan'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error deleting wallet type',
      error: error.message
    });
  }
};