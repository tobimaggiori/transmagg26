VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form RegFactProv 
   BackColor       =   &H80000007&
   Caption         =   "Registro Facturas Proveedores"
   ClientHeight    =   7710
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   9870
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   7710
   ScaleWidth      =   9870
   Begin VB.ComboBox Comp 
      Height          =   315
      Left            =   1560
      TabIndex        =   0
      Text            =   "Combo1"
      Top             =   120
      Width           =   2895
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   6240
      TabIndex        =   3
      Top             =   480
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   1920
      TabIndex        =   5
      Text            =   "Text1"
      Top             =   840
      Width           =   5655
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   1080
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   840
      Width           =   735
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   1920
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   480
      Width           =   2055
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1080
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   480
      Width           =   615
   End
   Begin KewlButtonz.KewlButtons AsigLiq 
      Height          =   735
      Left            =   1080
      TabIndex        =   30
      Top             =   6600
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Asignar Liquidacion"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "RegFactProv.frx":0000
      PICN            =   "RegFactProv.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Aceptar 
      Height          =   735
      Left            =   4200
      TabIndex        =   32
      Top             =   6600
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Grabar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   16777215
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "RegFactProv.frx":0493
      PICN            =   "RegFactProv.frx":04AF
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Cancelar 
      Height          =   735
      Left            =   6960
      TabIndex        =   33
      Top             =   6600
      Width           =   2055
      _ExtentX        =   3625
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Cancelar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "RegFactProv.frx":2531
      PICN            =   "RegFactProv.frx":254D
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Frame DetFactura 
      BackColor       =   &H80000006&
      Caption         =   "Detalle Factura"
      ForeColor       =   &H000080FF&
      Height          =   5175
      Left            =   240
      TabIndex        =   15
      Top             =   1320
      Width           =   9375
      Begin MSComctlLib.ListView DetFact 
         Height          =   2655
         Left            =   240
         TabIndex        =   23
         Top             =   1200
         Width           =   7215
         _ExtentX        =   12726
         _ExtentY        =   4683
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   4
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Cod. Concepto"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Descripción"
            Object.Width           =   6174
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Por IVA"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Neto"
            Object.Width           =   2646
         EndProperty
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   7
         Left            =   2520
         TabIndex        =   9
         Text            =   "Text1"
         Top             =   720
         Width           =   1335
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   6
         Left            =   1200
         TabIndex        =   8
         Text            =   "Text1"
         Top             =   720
         Width           =   735
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   5
         Left            =   2040
         TabIndex        =   7
         Text            =   "Text1"
         Top             =   360
         Width           =   5415
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   4
         Left            =   1200
         TabIndex        =   6
         Text            =   "Text1"
         Top             =   360
         Width           =   735
      End
      Begin KewlButtonz.KewlButtons AgregarViaje 
         Height          =   375
         Left            =   7560
         TabIndex        =   10
         Top             =   360
         Width           =   1575
         _ExtentX        =   2778
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Agregar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "RegFactProv.frx":2AE7
         PICN            =   "RegFactProv.frx":2B03
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons EliminarViaje 
         Height          =   375
         Left            =   7560
         TabIndex        =   31
         Top             =   720
         Width           =   1575
         _ExtentX        =   2778
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Eliminar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "RegFactProv.frx":4B85
         PICN            =   "RegFactProv.frx":4BA1
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Total"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   11
         Left            =   4440
         TabIndex        =   29
         Top             =   4800
         Width           =   735
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "IVA"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   10
         Left            =   4440
         TabIndex        =   28
         Top             =   4440
         Width           =   735
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Neto"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   9
         Left            =   4440
         TabIndex        =   27
         Top             =   4080
         Width           =   1095
      End
      Begin VB.Label Label2 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000005&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   4
         Left            =   6000
         TabIndex        =   26
         Top             =   4800
         Width           =   1215
      End
      Begin VB.Label Label2 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000005&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   3
         Left            =   6000
         TabIndex        =   25
         Top             =   4440
         Width           =   1215
      End
      Begin VB.Label Label2 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000005&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   2
         Left            =   6000
         TabIndex        =   24
         Top             =   4080
         Width           =   1215
      End
      Begin VB.Label Label2 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000005&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   1
         Left            =   6240
         TabIndex        =   22
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label2 
         Alignment       =   1  'Right Justify
         BackColor       =   &H80000005&
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   0
         Left            =   4320
         TabIndex        =   21
         Top             =   720
         Width           =   1335
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Total"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   8
         Left            =   5760
         TabIndex        =   20
         Top             =   720
         Width           =   735
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "IVA"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   7
         Left            =   3960
         TabIndex        =   19
         Top             =   720
         Width           =   735
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Neto"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   6
         Left            =   2040
         TabIndex        =   18
         Top             =   720
         Width           =   735
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Por. IVA"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   5
         Left            =   240
         TabIndex        =   17
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Concepto"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   4
         Left            =   240
         TabIndex        =   16
         Top             =   360
         Width           =   855
      End
   End
   Begin VB.Frame AsignarLiq 
      BackColor       =   &H80000007&
      Caption         =   "Asiganar Liquidaciones"
      ForeColor       =   &H000080FF&
      Height          =   5175
      Left            =   240
      TabIndex        =   34
      Top             =   1320
      Width           =   9375
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   8
         Left            =   3960
         TabIndex        =   38
         Text            =   "Text1"
         Top             =   4440
         Width           =   2055
      End
      Begin MSComctlLib.ListView LiqPend 
         Height          =   1815
         Left            =   360
         TabIndex        =   35
         Top             =   360
         Width           =   8655
         _ExtentX        =   15266
         _ExtentY        =   3201
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   6
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Nro Liq"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Fecha"
            Object.Width           =   2117
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Total Viajes"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Total Desc"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Total Comision"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Total a Pagar"
            Object.Width           =   2646
         EndProperty
      End
      Begin MSComctlLib.ListView ViajesAsignados 
         Height          =   1815
         Left            =   360
         TabIndex        =   36
         Top             =   2280
         Width           =   8655
         _ExtentX        =   15266
         _ExtentY        =   3201
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   6
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Nro Liq"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Fecha"
            Object.Width           =   2117
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Total Viajes"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Total Desc"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Total Comision"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Total a Pagar"
            Object.Width           =   2646
         EndProperty
      End
      Begin KewlButtonz.KewlButtons Volver 
         Height          =   375
         Left            =   6240
         TabIndex        =   39
         Top             =   4680
         Width           =   3015
         _ExtentX        =   5318
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Volver al Detalle"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "RegFactProv.frx":513B
         PICN            =   "RegFactProv.frx":5157
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Total Asignados:"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   12
         Left            =   2280
         TabIndex        =   37
         Top             =   4440
         Width           =   1455
      End
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Comprobante"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   13
      Left            =   240
      TabIndex        =   40
      Top             =   120
      Width           =   1215
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   3
      Left            =   4800
      TabIndex        =   14
      Top             =   480
      Width           =   855
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "-"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   2
      Left            =   1800
      TabIndex        =   13
      Top             =   480
      Width           =   855
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Número:"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   1
      Left            =   240
      TabIndex        =   12
      Top             =   480
      Width           =   855
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fletero"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   240
      TabIndex        =   11
      Top             =   840
      Width           =   1455
   End
End
Attribute VB_Name = "RegFactProv"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Asigna As Boolean
Private TVAsignado As Double
Private TFact As Double
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFactProv
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("Id") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function
Private Function GetNroAsiento()
' Devuelve una clave única basada en el número de cliente
    With rsAsientos
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetNroAsiento = .Fields("NroAsiento") + 1
            
        Else
            
            GetNroAsiento = 1
        
        End If
        
    End With
End Function

Private Sub Aceptar_Click()
Dim lPrimaryKey As Long, VNroAsiento As Long
Dim VEjercicio As Long, VMes As Long
If Asigna = True Then
    If Val(TFact) <> Val(TVAsignado) Then
        MsgBox "El importe de la Factura no es igual a las Liquidaciones Asignadas", vbInformation
        Exit Sub
    End If
End If
If Label2(4) = "0.00" Then
    MsgBox "Debe Cargar el detalle de la Factura"
    Exit Sub
End If
Set rsFactProv_Liq = db.OpenRecordset("FactProv_Liq")
Set rsEncabFactProv = db.OpenRecordset("EncabFactProv")
Set rsDetFactProv = db.OpenRecordset("DetFactProv")
Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
Set rsAsientos = db.OpenRecordset("Asientos")
lPrimaryKey = GetPrimaryKey
'graba encabezado factura
With rsEncabFactProv
    .AddNew
    .Fields("CodProv") = Text1(2)
    .Fields("PtoVta") = Text1(0)
    .Fields("NroFact") = Text1(1)
    .Fields("TotalNeto") = FormatNumber(Label2(2))
    .Fields("IVA") = FormatNumber(Label2(3))
    .Fields("Total") = FormatNumber(Label2(4))
    .Fields("Fecha") = Fecha
    .Fields("Id") = lPrimaryKey
    .Fields("CodComp") = Comp.ListIndex + 1
    .Fields("LIVA") = "SI"
    .Update
End With
Set rsEncabFactProv = Nothing
'graba detella factura
Items = 0
With rsDetFactProv
    For Items = Items + 1 To DetFact.ListItems.Count
        Set Lista = DetFact.ListItems.Item(Items)
        .AddNew
        .Fields("PtoVta") = Text1(0)
        .Fields("NroFact") = Text1(1)
        .Fields("CodConcepto") = Lista.Tag
        .Fields("Importe") = Lista.SubItems(3)
        .Fields("Id") = lPrimaryKey
        .Update
    Next
End With
Set rsDetFactProv = Nothing
'graba aplicacion de liquidaciones
If Asigna = True Then
        Items = 0
        For Items = Items + 1 To ViajesAsignados.ListItems.Count
            Set Lista = ViajesAsignados.ListItems.Item(Items)
            With rsFactProv_Liq
            .AddNew
            .Fields("CodProv") = Text1(2)
            .Fields("PtoVta") = Text1(0)
            .Fields("NroFact") = Text1(1)
            .Fields("NroLiq") = Lista.Tag
            .Update
            End With
            'ACTUALIZA ESTADO DE LIQUIDACIONES
            Set rsEncabLiq = db.OpenRecordset("SELECT * FROM EncabLiquidacion Where NroLiq = " & Lista.Tag & "")
            rsEncabLiq.Edit
            rsEncabLiq.LockEdits = True
            rsEncabLiq.Fields("Pagada") = "SI"
            rsEncabLiq.Update
            rsEncabLiq.LockEdits = False
            Set rsEncabLiq = Nothing
        Next
      Set rsFactProv_Liq = Nothing
End If

'graba en cta cte
With rsCtaCteProv
    .AddNew
    .Fields("Fecha") = Fecha
    .Fields("CodProv") = Text1(2)
    .Fields("PtoVta") = Text1(0)
    .Fields("NroComp") = Text1(1)
    .Fields("TipoComp") = Comp.ListIndex + 1
    If Comp.ListIndex = 0 Or Comp.ListIndex = 2 Then
        .Fields("Haber") = FormatNumber(Label2(4))
    Else
        .Fields("Debe") = FormatNumber(Label2(4))
    End If
    .Fields("SaldoComp") = FormatNumber(Label2(4))
    .Update
End With
Set rsCtaCteProv = Nothing
'Graba Asiento
With rsAsientos
    Items = 0
    VNroAsiento = GetNroAsiento
    VFecha = Fecha
    VEjercicio = Mid(VFecha, 7, 4)
    VMes = Mid(VFecha, 4, 2)
    For Items = Items + 1 To DetFact.ListItems.Count
        Set Lista = DetFact.ListItems.Item(Items)
        Set rsConceptoCompras = db.OpenRecordset("Select * from ConceptoCompras Where CodConcepto = " & Lista.Tag & "")
        .AddNew
        .Fields("NroAsiento") = VNroAsiento
        .Fields("CtaCont") = rsConceptoCompras.Fields("CtaCont")
        If Comp.ListIndex = 0 Or Comp.ListIndex = 2 Then
            .Fields("Debe") = Lista.SubItems(3)
        Else
            .Fields("Haber") = Lista.SubItems(3)
        End If
        .Fields("CodComp") = Comp.ListIndex + 1
        .Fields("PtoVta") = Text1(0)
        .Fields("NroComp") = Text1(1)
        .Fields("Codigo") = Text1(2)
        .Fields("Fecha") = Fecha
        .Fields("TipoAsiento") = 1
        .Fields("Ejercicio") = VEjercicio
        .Fields("Mes") = VMes
        .Update
    Next
    If Not Label2(3) = "0.00" Then
        'graba IVA
        .AddNew
        .Fields("NroAsiento") = VNroAsiento
        Set rsParametros = db.OpenRecordset("Select * From Parametros Where Codigo = 3")
        .Fields("CtaCont") = rsParametros.Fields("CtaCont")
        If Comp.ListIndex = 0 Or Comp.ListIndex = 2 Then
            .Fields("Debe") = Label2(3)
        Else
            .Fields("Haber") = Label2(3)
        End If
        .Fields("CodComp") = Comp.ListIndex + 1
        .Fields("PtoVta") = Text1(0)
        .Fields("NroComp") = Text1(1)
        .Fields("Codigo") = Text1(2)
        .Fields("Fecha") = Fecha
        .Fields("TipoAsiento") = 1
        .Fields("Ejercicio") = VEjercicio
        .Fields("Mes") = VMes
        .Update
    End If
    'graba saldo del haber
    .AddNew
    .Fields("NroAsiento") = VNroAsiento
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(2) & "")
    .Fields("CtaCont") = rsFleteros.Fields("CtaContable")
    If Comp.ListIndex = 0 Or Comp.ListIndex = 2 Then
        .Fields("Haber") = Label2(4)
    Else
        .Fields("Debe") = Label2(4)
    End If
    .Fields("CodComp") = Comp.ListIndex + 1
    .Fields("PtoVta") = Text1(0)
    .Fields("NroComp") = Text1(1)
    .Fields("Codigo") = Text1(2)
    .Fields("Fecha") = Fecha
    .Fields("TipoAsiento") = 1
    .Fields("Ejercicio") = VEjercicio
    .Fields("Mes") = VMes
    .Update
End With
Set rsAsientos = Nothing
Set rsParametros = Nothing
Set rsConceptoCompras = Nothing
Set rsFleteros = Nothing
MsgBox "Coprobante Grabado Correctamente", vbInformation
Items = 0
For Items = Items + 1 To Text1.Count
    If Items > 6 Then
        Text1(Items - 1) = "0.00"
    Else
        Text1(Items - 1) = ""
    End If
Next
Items = 0
For Items = Items + 1 To Label2.Count
    Label2(Items - 1) = "0.00"
Next
DetFact.ListItems.Clear
LiqPend.ListItems.Clear
ViajesAsignados.ListItems.Clear
Comp.ListIndex = 0
TNetoFact = 0: TIVAFact = 0: TFact = 0
TVAsignado = 0
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"
Asigna = False
DetFactura.Visible = True: AsignarLiq.Visible = False
DetFactura.Top = 1200
DetFactura.Left = 240
DetFactura.Height = 5175
DetFactura.Width = 9375
End Sub
Private Sub AgregarViaje_Click()
If Not Text1(4) = "" Or Not Text1(6) = "" Or Not Text1(7) = "" Then
    Set Lista = DetFact.ListItems.Add(, , Text1(4))
        Lista.Tag = Text1(4)
        Lista.SubItems(1) = Text1(5)
        Lista.SubItems(2) = Text1(6)
        Lista.SubItems(3) = Text1(7)
        TNetoFact = TNetoFact + Text1(7)
        TIVAFact = TIVAFact + Label2(0)
        TFact = TNetoFact + TIVAFact
        Label2(2) = FormatNumber(TNetoFact)
        Label2(3) = FormatNumber(TIVAFact)
        Label2(4) = FormatNumber(TFact)
        Text1(4) = "": Text1(5) = "": Text1(6) = "0.00": Text1(7) = "0.00": Label2(0) = "0.00": Label2(1) = "0.00"
        Text1(4).SetFocus
End If
End Sub

Private Sub AsigLiq_Click()
DetFactura.Visible = False: AsignarLiq.Visible = True
AsignarLiq.Top = 1200
AsignarLiq.Left = 240
AsignarLiq.Height = 5175
AsignarLiq.Width = 9375
Asigna = True
End Sub

Private Sub Cancelar_Click()
Form_Initialize
Form_Load
End Sub

Private Sub EliminarViaje_Click()
If DetFact.ListItems.Count = 0 Then
    MsgBox "No hay items cargados", vbInformation
Else
    Dim IVA As Double
    Set Lista = DetFact.ListItems.Item(DetFact.SelectedItem.Index)
    IVA = Lista.SubItems(3) * Lista.SubItems(2) / 100
    TIVAFact = TIVAFact - IVA
    TNetoFact = TNetoFact - Lista.SubItems(3)
    TFact = TNetoFact + TIVAFact
    Label2(2) = FormatNumber(TNetoFact)
    Label2(3) = FormatNumber(TIVAFact)
    Label2(4) = FormatNumber(TFact)
    DetFact.ListItems.Remove (DetFact.SelectedItem.Index)
End If
End Sub

Private Sub Fecha_GotFocus()
x = Len(Fecha)
Fecha.SelStart = 0
Fecha.SelLength = x

End Sub

Private Sub Fecha_LostFocus()
If IsDate(Fecha) = False Then
    MsgBox "Fecha no válida", vbInformation
    Fecha.SetFocus
End If
End Sub

Private Sub Form_Initialize()
Set rsDetFactProv = Nothing
Set rsEncabFactProv = Nothing
Set rsConceptoCompras = Nothing
Set rsParametros = Nothing
Set rsAsientos = Nothing
Set rsCtaCteProv = Nothing
Set rsFleteros = Nothing
Set rsComprobantes = Nothing
Set rsEncabLiq = Nothing
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call BuscarFlet
Case vbKeyF5: Call Aceptar_Click
End Select
End Sub
Private Sub BuscarFlet()
With BuscFlet
    .Show
    .Height = 6015
    .Width = 6225
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
    .Viene = "RegFactProv"
End With
End Sub

Private Sub Form_Load()
Items = 0
For Items = Items + 1 To Text1.Count
    If Items > 6 Then
        Text1(Items - 1) = "0.00"
    Else
        Text1(Items - 1) = ""
    End If
Next
Items = 0
For Items = Items + 1 To Label2.Count
    Label2(Items - 1) = "0.00"
Next
Set rsComprobantes = db.OpenRecordset("Comprobantes")
Do While Not rsComprobantes.EOF
    Comp.AddItem rsComprobantes.Fields("DescComp")
    rsComprobantes.MoveNext
Loop
Comp.ListIndex = 0
Set rsComprobantes = Nothing
TNetoFact = 0: TIVAFact = 0: TFact = 0
TVAsignado = 0
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"
Asigna = False
DetFactura.Visible = True: AsignarLiq.Visible = False
DetFactura.Top = 1200
DetFactura.Left = 240
DetFactura.Height = 5175
DetFactura.Width = 9375

End Sub

Private Sub LiqPend_DblClick()
On Error Resume Next
Set Lista = LiqPend.ListItems.Item(LiqPend.SelectedItem.Index)
Set LVAsignado = ViajesAsignados.ListItems.Add(, , Lista.Tag)
LVAsignado.Tag = Lista.Tag
LVAsignado.SubItems(1) = Lista.SubItems(1)
LVAsignado.SubItems(2) = Lista.SubItems(2)
LVAsignado.SubItems(3) = Lista.SubItems(3)
LVAsignado.SubItems(4) = Lista.SubItems(4)
LVAsignado.SubItems(5) = Lista.SubItems(5)
TVAsignado = TVAsignado + Lista.SubItems(2)
Text1(8) = FormatNumber(TVAsignado)
LiqPend.ListItems.Remove (LiqPend.SelectedItem.Index)
End Sub

Private Sub Text1_Change(Index As Integer)
Dim IVA As Double, STotal As Double
Select Case Index
    Case 7:
            IVA = Text1(7) * Text1(6) / 100
            STotal = Text1(7) + IVA
            Label2(0) = FormatNumber(IVA)
            Label2(1) = FormatNumber(STotal)
    Case 6:
            If Not IsNull(Text1(7)) = True Then
                Text1(7) = "0.00"
            End If
            IVA = Text1(7) * Text1(6) / 100
            STotal = Text1(7) + IVA
            Label2(0) = FormatNumber(IVA)
            Label2(1) = FormatNumber(STotal)
End Select
End Sub

Private Sub Text1_GotFocus(Index As Integer)
If Index = 6 Or Index = 7 Then
    Dim I As Integer
    I = Len(Text1(Index))
    Text1(Index).SelStart = 0
    Text1(Index).SelLength = I
End If
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Dim Tamaño As Integer
Select Case Index
    Case 0:
        Tamaño = Len(Text1(0))
        Select Case Tamaño
            Case 1: Text1(0) = "000" & Text1(0)
            Case 2: Text1(0) = "00" & Text1(0)
            Case 3: Text1(0) = "0" & Text1(0)
            Case 4: Text1(0) = Text1(0)
            Case Is > 4: MsgBox "No puede tener más de 4(cuatro) digitos", vbInformation
                        Text1(0) = ""
                        Text1(0).SetFocus
        End Select
    Case 1:
        Tamaño = Len(Text1(1))
        Select Case Tamaño
            Case 1: Text1(1) = "0000000" & Text1(1)
            Case 2: Text1(1) = "000000" & Text1(1)
            Case 3: Text1(1) = "00000" & Text1(1)
            Case 4: Text1(1) = "0000" & Text1(1)
            Case 5: Text1(1) = "000" & Text1(1)
            Case 6: Text1(1) = "00" & Text1(1)
            Case 7: Text1(1) = "0" & Text1(1)
            Case 8: Text1(1) = Text1(1)
            Case Is > 8: MsgBox "No puede tener más de 8(ocho) dígitos", vbInformation
                         Text1(1) = ""
                         Text1(1).SetFocus
        End Select
    Case 2:
            If Not Text1(2) = "" Then
                Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(2) & "")
                If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                    Text1(3) = rsFleteros!DescFlet
                    Set rsEncabLiq = Nothing
                    Set rsEncabLiq = db.OpenRecordset("Select * From EncabLiquidacion Where CodFlet = " & rsFleteros!CodFlet & " And Pagada = 'NO'")
                    If Not rsEncabLiq.EOF And Not rsEncabLiq.BOF Then
                    LiqPend.ListItems.Clear
                        Do While Not rsEncabLiq.EOF
                            Set Lista = LiqPend.ListItems.Add(, , rsEncabLiq!NroLiq)
                            Lista.Tag = rsEncabLiq!NroLiq
                            Lista.SubItems(1) = rsEncabLiq!Fecha
                            Lista.SubItems(2) = FormatNumber(rsEncabLiq!TViajes)
                            Lista.SubItems(3) = FormatNumber(rsEncabLiq!TDescuentos)
                            Lista.SubItems(4) = FormatNumber(rsEncabLiq!TComis)
                            Lista.SubItems(5) = FormatNumber(rsEncabLiq!TPagar)
                            rsEncabLiq.MoveNext
                        Loop
                    End If
                    Set rsEncabLiq = Nothing
                    Text1(4).SetFocus
                Else
                    MsgBox "El proveedor no Existe", vbInformation
                    Text1(2) = ""
                    Text1(2).SetFocus
                End If
                Set rsFleteros = Nothing
            End If
    Case 4:
        If Not Text1(4) = "" Then
            Set rsConceptoCompras = db.OpenRecordset("Select * From ConceptoCompras Where CodConcepto = " & Text1(4) & "")
            If Not rsConceptoCompras.EOF And Not rsConceptoCompras.BOF Then
                Text1(5) = rsConceptoCompras!descconcepto
                Text1(6).SetFocus
            Else
                MsgBox "El Concepto no Existe", vbInformation
            End If
            Set rsConceptoCompras = Nothing
        End If
End Select
End Sub

Private Sub Volver_Click()
DetFactura.Visible = True: AsignarLiq.Visible = False
DetFactura.Top = 1200
DetFactura.Left = 240
DetFactura.Height = 5175
DetFactura.Width = 9375

End Sub
