/**
 * API Route for appointment management
 * GET /api/appointments - List appointments with filters
 * POST /api/appointments - Create a new appointment
 */

import { NextResponse } from "next/server";
import {
  createAppointment,
  listAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  type AppointmentStatus,
  type AppointmentType,
} from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const userEmailAddress = searchParams.get("userEmailAddress");
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status") as AppointmentStatus | null;
    const appointmentType = searchParams.get("appointmentType") as AppointmentType | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const appointmentId = searchParams.get("appointmentId");

    // Get single appointment by ID
    if (appointmentId) {
      const appointment = await getAppointmentById(appointmentId);
      if (!appointment) {
        return NextResponse.json(
          { success: false, error: "Appointment not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, appointment });
    }

    // List appointments with filters
    const appointments = await listAppointments({
      userEmailAddress: userEmailAddress || undefined,
      doctorId: doctorId || undefined,
      status: status || undefined,
      appointmentType: appointmentType || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json({
      success: true,
      appointments,
      count: appointments.length,
    });
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const appointmentData = await request.json();

    // Validate required fields
    const requiredFields = [
      "userEmailAddress",
      "doctorId",
      "appointmentDate",
      "appointmentTime",
      "appointmentType",
      "status",
    ];

    for (const field of requiredFields) {
      if (!appointmentData[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate confirmation code if not provided
    if (!appointmentData.confirmationCode) {
      appointmentData.confirmationCode = `CONF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    // Create appointment
    const appointmentId = await createAppointment({
      userEmailAddress: appointmentData.userEmailAddress,
      doctorId: appointmentData.doctorId,
      appointmentDate: appointmentData.appointmentDate,
      appointmentTime: appointmentData.appointmentTime,
      appointmentType: appointmentData.appointmentType,
      status: appointmentData.status || "scheduled",
      confirmationCode: appointmentData.confirmationCode,
      notes: appointmentData.notes,
      estimatedCost: appointmentData.estimatedCost,
    });

    // Get the created appointment
    const appointment = await getAppointmentById(appointmentId);

    return NextResponse.json({
      success: true,
      message: "Appointment created successfully",
      appointment,
      appointmentId,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    
    if (error.number === 2627) {
      return NextResponse.json(
        { success: false, error: "Appointment with this ID already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create appointment" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { appointmentId, ...updates } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "appointmentId is required" },
        { status: 400 }
      );
    }

    await updateAppointment(appointmentId, updates);
    const updatedAppointment = await getAppointmentById(appointmentId);

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "appointmentId is required" },
        { status: 400 }
      );
    }

    await deleteAppointment(appointmentId);
    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete appointment" },
      { status: 500 }
    );
  }
}

