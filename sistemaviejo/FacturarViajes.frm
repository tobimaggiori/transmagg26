VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{FF19AA0C-2968-41B8-A906-E80997A9C394}#253.0#0"; "WSAFIPFEOCX.ocx"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form FacturarViajes 
   BackColor       =   &H00000000&
   Caption         =   "Facturar Viajes"
   ClientHeight    =   10170
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   14085
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   10170
   ScaleWidth      =   14085
   Begin VB.Frame Frame1 
      BackColor       =   &H80000007&
      Caption         =   "Viajes:"
      ForeColor       =   &H0080C0FF&
      Height          =   615
      Left            =   4680
      TabIndex        =   52
      Top             =   0
      Width           =   3735
      Begin VB.OptionButton Option1 
         BackColor       =   &H00000000&
         Caption         =   "Propios"
         ForeColor       =   &H0080C0FF&
         Height          =   195
         Index           =   1
         Left            =   2040
         TabIndex        =   54
         Top             =   240
         Width           =   1335
      End
      Begin VB.OptionButton Option1 
         BackColor       =   &H00000000&
         Caption         =   "Terceros"
         ForeColor       =   &H0080C0FF&
         Height          =   195
         Index           =   0
         Left            =   360
         TabIndex        =   53
         Top             =   240
         Width           =   1335
      End
   End
   Begin VB.CommandButton Command1 
      Caption         =   "Actualiza Estado Viajes"
      Height          =   375
      Left            =   11160
      TabIndex        =   51
      Top             =   240
      Visible         =   0   'False
      Width           =   1455
   End
   Begin WSAFIPFEOCX.WSAFIPFEx FE 
      Left            =   600
      Top             =   8760
      _ExtentX        =   1508
      _ExtentY        =   661
   End
   Begin VB.ComboBox Combo1 
      Height          =   315
      Left            =   10680
      TabIndex        =   49
      Text            =   "Combo1"
      Top             =   720
      Width           =   2775
   End
   Begin VB.ComboBox OPFPago 
      Height          =   315
      Left            =   7320
      TabIndex        =   47
      Text            =   "Combo1"
      Top             =   720
      Width           =   1935
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   8
      Left            =   5520
      TabIndex        =   46
      Text            =   "Text1"
      Top             =   4680
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   11
      Left            =   6240
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   240
      Visible         =   0   'False
      Width           =   1575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   10
      Left            =   5160
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   240
      Visible         =   0   'False
      Width           =   975
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   9
      Left            =   8880
      TabIndex        =   38
      Text            =   "Text1"
      Top             =   4680
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   7320
      TabIndex        =   36
      Text            =   "Text1"
      Top             =   4680
      Width           =   1455
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   10080
      TabIndex        =   40
      Text            =   "Text1"
      Top             =   4680
      Width           =   1095
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   9240
      TabIndex        =   3
      Top             =   240
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.ComboBox Comprobante 
      Height          =   315
      Left            =   1920
      TabIndex        =   24
      Text            =   "Combo1"
      Top             =   240
      Width           =   2655
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   5
      Left            =   10440
      TabIndex        =   23
      Text            =   "Text1"
      Top             =   9720
      Width           =   1575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   4
      Left            =   10440
      TabIndex        =   22
      Text            =   "Text1"
      Top             =   9240
      Width           =   1575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   10440
      TabIndex        =   21
      Text            =   "Text1"
      Top             =   8760
      Width           =   1575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   11280
      TabIndex        =   42
      Text            =   "Text1"
      Top             =   4680
      Width           =   975
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2160
      TabIndex        =   20
      Text            =   "Text1"
      Top             =   720
      Width           =   3975
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1080
      TabIndex        =   4
      Text            =   "Text1"
      Top             =   720
      Width           =   975
   End
   Begin VB.Frame ViajesFact 
      BackColor       =   &H80000007&
      Caption         =   "Viajes a Facturar"
      ForeColor       =   &H000040C0&
      Height          =   3255
      Left            =   120
      TabIndex        =   9
      Top             =   5160
      Width           =   12615
      Begin MSComctlLib.ListView LViajesFact 
         Height          =   2775
         Left            =   120
         TabIndex        =   25
         Top             =   240
         Width           =   12195
         _ExtentX        =   21511
         _ExtentY        =   4895
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   13
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Rem"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Chofer"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Mercaderia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Procedencia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Destino"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Kilos"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "SubTotal"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   9
            Text            =   "CodEmpresa"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   10
            Text            =   "CodChofer"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   11
            Text            =   "NroViaje"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   12
            Text            =   "Cupo"
            Object.Width           =   2540
         EndProperty
      End
   End
   Begin VB.Frame ViajesPend 
      BackColor       =   &H80000007&
      Caption         =   "Viajes Pendientes"
      ForeColor       =   &H000040C0&
      Height          =   3255
      Left            =   120
      TabIndex        =   7
      Top             =   1080
      Width           =   12615
      Begin MSComctlLib.ListView ListaViajes 
         Height          =   2775
         Left            =   120
         TabIndex        =   8
         Top             =   360
         Width           =   12195
         _ExtentX        =   21511
         _ExtentY        =   4895
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         FullRowSelect   =   -1  'True
         GridLines       =   -1  'True
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483643
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   13
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Rem"
            Object.Width           =   2293
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Chofer"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Mercaderia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Procedencia"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Destino"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Kilos"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "SubTotal"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   9
            Text            =   "CodEmpresa"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   10
            Text            =   "CodChofer"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   11
            Text            =   "NroViaje"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   12
            Text            =   "Cupo"
            Object.Width           =   2540
         EndProperty
      End
   End
   Begin KewlButtonz.KewlButtons OkViajes 
      Height          =   495
      Left            =   13320
      TabIndex        =   26
      Top             =   4560
      Width           =   735
      _ExtentX        =   1296
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Ok"
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
      FCOLO           =   14737632
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "FacturarViajes.frx":0000
      PICN            =   "FacturarViajes.frx":001C
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
      Left            =   2520
      TabIndex        =   27
      Top             =   8880
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Aceptar"
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
      MICON           =   "FacturarViajes.frx":0A2E
      PICN            =   "FacturarViajes.frx":0A4A
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
      Left            =   4680
      TabIndex        =   28
      Top             =   8880
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
      MICON           =   "FacturarViajes.frx":2ACC
      PICN            =   "FacturarViajes.frx":2AE8
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
      Caption         =   "Vencimiento"
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
      Index           =   17
      Left            =   9360
      TabIndex        =   50
      Top             =   720
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Vencimiento"
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
      Index           =   16
      Left            =   6240
      TabIndex        =   48
      Top             =   720
      Width           =   1455
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Tarifas"
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
      Index           =   15
      Left            =   11280
      TabIndex        =   45
      Top             =   4440
      Width           =   975
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Kilos"
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
      Index           =   14
      Left            =   9840
      TabIndex        =   44
      Top             =   4440
      Width           =   1575
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Destino"
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
      Left            =   7320
      TabIndex        =   43
      Top             =   4440
      Width           =   1455
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Origen"
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
      Left            =   5520
      TabIndex        =   41
      Top             =   4440
      Width           =   1695
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Mercaderia"
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
      Left            =   3840
      TabIndex        =   39
      Top             =   4440
      Width           =   1575
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Chofer"
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
      Left            =   2040
      TabIndex        =   37
      Top             =   4440
      Width           =   1695
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Remito"
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
      Left            =   1080
      TabIndex        =   35
      Top             =   4440
      Width           =   855
   End
   Begin VB.Label Label1 
      Alignment       =   2  'Center
      BackColor       =   &H00000000&
      Caption         =   "Fecha"
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
      Left            =   120
      TabIndex        =   34
      Top             =   4440
      Width           =   855
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Nro"
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
      Left            =   4680
      TabIndex        =   33
      Top             =   240
      Visible         =   0   'False
      Width           =   495
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Cupo"
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
      Height          =   375
      Index           =   6
      Left            =   8880
      TabIndex        =   32
      Top             =   4440
      Width           =   1455
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   10
      Left            =   4080
      TabIndex        =   31
      Top             =   4320
      Visible         =   0   'False
      Width           =   855
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   9
      Left            =   3120
      TabIndex        =   30
      Top             =   4320
      Visible         =   0   'False
      Width           =   855
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   8
      Left            =   2160
      TabIndex        =   29
      Top             =   4320
      Visible         =   0   'False
      Width           =   855
   End
   Begin VB.Shape Shape1 
      BorderColor     =   &H000040C0&
      BorderWidth     =   2
      FillColor       =   &H000040C0&
      Height          =   1575
      Left            =   8160
      Top             =   8520
      Width           =   4575
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   7
      Left            =   12360
      TabIndex        =   19
      Top             =   4680
      Width           =   855
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   5
      Left            =   7320
      TabIndex        =   18
      Top             =   4320
      Visible         =   0   'False
      Width           =   1455
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   4
      Left            =   5520
      TabIndex        =   17
      Top             =   4320
      Visible         =   0   'False
      Width           =   1695
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   3
      Left            =   3840
      TabIndex        =   16
      Top             =   4680
      Width           =   1575
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   2
      Left            =   2040
      TabIndex        =   15
      Top             =   4680
      Width           =   1695
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   1
      Left            =   1080
      TabIndex        =   14
      Top             =   4680
      Width           =   855
   End
   Begin VB.Label Viaje 
      BorderStyle     =   1  'Fixed Single
      Height          =   285
      Index           =   0
      Left            =   120
      TabIndex        =   13
      Top             =   4680
      Width           =   855
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
      Index           =   5
      Left            =   8760
      TabIndex        =   12
      Top             =   9720
      Width           =   1455
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
      Index           =   4
      Left            =   8760
      TabIndex        =   11
      Top             =   9240
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Sub Total"
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
      Left            =   8760
      TabIndex        =   10
      Top             =   8760
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fecha"
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
      Left            =   8520
      TabIndex        =   6
      Top             =   240
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Empresa"
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
      TabIndex        =   5
      Top             =   720
      Width           =   1455
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
      Index           =   0
      Left            =   240
      TabIndex        =   0
      Top             =   240
      Width           =   1455
   End
End
Attribute VB_Name = "FacturarViajes"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim VVPtoVta As Integer
Dim UltNro As String, FVto As String, FServD As String, FservH As String, FPago As String, VNetoFE As Double
Dim VivaFE As Double, FCte As String, VCUIT As String, VTipoDoc As Single, VIndice As Long, VtipoComp
Dim VCAE As String, VMOTIVO As String, VProceso As String, VNro As String, ErrorCAE As String, VRuta As String

Private Sub genera_cae1()
If FE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
    FE.ArchivoCertificadoPassword = "hercasa1509"
    If FE.f1ObtenerTicketAcceso() Then
        FE.F1CabeceraCantReg = 1
        FE.F1CabeceraPtoVta = 4
        FE.F1CabeceraCbteTipo = VtipoComp

        FE.f1Indice = 0
        FE.F1DetalleConcepto = 2
        FE.F1DetalleDocTipo = VTipoDoc
        FE.F1DetalleDocNro = VCUIT
        FE.F1DetalleCbteDesde = VNro
        FE.F1DetalleCbteHasta = VNro
        FE.F1DetalleCbteFch = FCte
        FE.F1DetalleImpTotal = FormatNumber(TFact)
        FE.F1DetalleImpTotalConc = 0
        FE.F1DetalleImpNeto = FormatNumber(VNetoFE)
        FE.F1DetalleImpOpEx = 0
        FE.F1DetalleImpTrib = 0
        FE.F1DetalleImpIva = FormatNumber(TIVAFact)
        FE.F1DetalleFchServDesde = FServD
        FE.F1DetalleFchServHasta = FservH
        FE.F1DetalleFchVtoPago = FPago
        FE.F1DetalleMonIdS = "PES"
        FE.F1DetalleMonCotiz = 1
        FE.F1DetalleIvaItemCantidad = 1
        FE.f1IndiceItem = 0
        FE.F1DetalleIvaId = 5
        FE.F1DetalleIvaBaseImp = FormatNumber(VNetoFE)
        FE.F1DetalleIvaImporte = FormatNumber(TIVAFact)

        FE.F1DetalleCbtesAsocItemCantidad = 0
        FE.F1DetalleOpcionalItemCantidad = 0

        FE.ArchivoXMLRecibido = App.Path + "\XML\recibido.xml"
        FE.ArchivoXMLEnviado = App.Path + "\XML\enviado.xml"
        
        lResultado = FE.F1CAESolicitar()
      'GENERA QR
        FE.F1CabeceraCantReg = 1
                FE.F1CabeceraPtoVta = 4
                FE.F1CabeceraCbteTipo = VtipoComp
                FE.f1Indice = 0
                FE.qrVersion = 1
                FE.F1DetalleConcepto = 1
                FE.F1DetalleDocTipo = 80
                FE.F1DetalleDocNro = VCUIT
                FE.F1DetalleCbteDesdeS = NroQR
                FE.F1DetalleCbteFch = FCte
                i = Len(FormatNumber(TFact))
                For A = i To 1 Step -1
                    DIGITO = Mid(FormatNumber(TFact), A, 1)
                    If Not DIGITO = "." Then
                        VTOTAL = DIGITO & VTOTAL
                    End If
                Next
                FE.F1DetalleImpTotal = VTOTAL
                FE.F1DetalleMonId = "PES"
                FE.F1DetalleMonCotiz = 1
                FE.F1Detalleqrtipocodigo = "E"
                Rem  fe.F1Detalleqrtipocodigo = "A" si es un CAE anticipado
                FE.F1DetalleCAEA = 1
                FE.F1DetalleQRArchivo = App.Path + "\QR\qr" & VtipoComp & "_4_" & NroQR & ".jpg"
                FE.f1detalleqrtolerancia = 1
                FE.f1detalleqrresolucion = 4
                FE.f1detalleqrformato = 6
                If FE.f1qrGenerar(99) Then
                    'MsgBox ("gráfico generado con los datos. " + FE.f1qrmanualTexto)
                Else
                    MsgBox ("error al generar imagen " + FE.ArchivoQRError + " " + FE.UltimoMensajeError)
                End If
     
        If lResultado Then
            MsgBox ("Factura Generada")
        Else
            MsgBox ("Error de Solicitud de CAE")
        End If
        'MsgBox ("error local: " + FE.UltimoMensajeError)
        'MsgBox ("ERROR:")
        'ULT = FE.F1CompUltimoAutorizadoS(4, 1)
        'Fecha = FE.F1CompUltimoAutorizadoST
        'MsgBox ("resultado global AFIP: " + FE.F1RespuestaResultado)
        'MsgBox ("es reproceso? " + FE.F1RespuestaReProceso)
        'MsgBox ("registros procesados por AFIP: " + Str(FE.F1RespuestaCantidadReg))
        'MsgBox ("error genérico global:" + FE.f1ErrorMsg1)
        If FE.F1RespuestaCantidadReg > 0 Then
            'FE.f1Indice = 0
            'MsgBox ("resultado detallado comprobante: " + FE.F1RespuestaDetalleResultado)
        'MsgBox ("cae comprobante: " + FE.F1RespuestaDetalleCae)
        'MsgBox ("número comprobante:" + FE.F1RespuestaDetalleCbteDesdeS)
        'MsgBox ("error detallado comprobante: " + FE.F1RespuestaDetalleObservacionMsg1)
        Exit Sub
      End If
   Else
      MsgBox ("fallo acceso " + FE.UltimoMensajeError)
   End If
Else
   MsgBox ("fallo iniciar " + FE.UltimoMensajeError)
End If
End Sub
Private Sub Genera_CAE_MiPyme()
If FE.iniciar(modoFiscal_Fiscal, "30709381683", App.Path + "\Certificado\Certificado.pfx", App.Path + "\Certificado\WSAFIPFE.lic") Then
   FE.ArchivoCertificadoPassword = "hercasa1509"
   If FE.f1ObtenerTicketAcceso() Then
      FE.F1CabeceraCantReg = 1
      FE.F1CabeceraPtoVta = 4
      FE.F1CabeceraCbteTipo = VtipoComp
      
      FE.f1Indice = 0
      FE.F1DetalleConcepto = 2
      FE.F1DetalleDocTipo = VTipoDoc
      FE.F1DetalleDocNro = VCUIT
      FE.F1DetalleCbteDesde = VNro
      FE.F1DetalleCbteHasta = VNro
      FE.F1DetalleCbteFch = FCte
      FE.F1DetalleImpTotal = FormatNumber(TFact)
      FE.F1DetalleImpTotalConc = 0
      FE.F1DetalleImpNeto = FormatNumber(VNetoFE)
      FE.F1DetalleImpOpEx = 0
      FE.F1DetalleImpTrib = 0
      FE.F1DetalleImpIva = FormatNumber(TIVAFact)
      FE.F1DetalleFchServDesde = FServD
      FE.F1DetalleFchServHasta = FservH
      FE.F1DetalleFchVtoPago = FPago
      FE.F1DetalleMonIdS = "PES"
      FE.F1DetalleMonCotiz = 1
      
      FE.F1DetalleIvaItemCantidad = 1
      FE.f1IndiceItem = 0
      FE.F1DetalleIvaId = 5
      FE.F1DetalleIvaBaseImp = FormatNumber(VNetoFE)
      FE.F1DetalleIvaImporte = FormatNumber(TIVAFact)
      
      FE.F1DetalleOpcionalItemCantidad = 2
      FE.f1IndiceItem = 0
      FE.F1DetalleOpcionalId = 2101
      FE.F1DetalleOpcionalValor = "3300043310430002552086"
      FE.f1IndiceItem = 1
      FE.F1DetalleOpcionalId = 27
      If Combo1.ListIndex = 0 Then
        FE.F1DetalleOpcionalValor = "SCA"
    Else
        FE.F1DetalleOpcionalValor = "ADC"
      End If
      FE.F1DetalleCbtesAsocItemCantidad = 0
      'FE.F1DetalleOpcionalItemCantidad = 0

      FE.ArchivoXMLRecibido = App.Path + "\XML\recibido.xml"
      FE.ArchivoXMLEnviado = App.Path + "\XML\enviado.xml"

      lResultado = FE.F1CAESolicitar()
      'GENERA QR
     FE.F1CabeceraCantReg = 1
                FE.F1CabeceraPtoVta = 4
                FE.F1CabeceraCbteTipo = VtipoComp
                FE.f1Indice = 0
                FE.qrVersion = 1
                FE.F1DetalleConcepto = 1
                FE.F1DetalleDocTipo = 80
                FE.F1DetalleDocNro = VCUIT
                FE.F1DetalleCbteDesdeS = NroQR
                FE.F1DetalleCbteFch = FCte
                i = Len(FormatNumber(TFact))
                For A = i To 1 Step -1
                    DIGITO = Mid(FormatNumber(TFact), A, 1)
                    If Not DIGITO = "." Then
                        VTOTAL = DIGITO & VTOTAL
                    End If
                Next
                FE.F1DetalleImpTotal = VTOTAL
                FE.F1DetalleMonId = "PES"
                FE.F1DetalleMonCotiz = 1
                FE.F1Detalleqrtipocodigo = "E"
                Rem  fe.F1Detalleqrtipocodigo = "A" si es un CAE anticipado
                FE.F1DetalleCAEA = 1
                FE.F1DetalleQRArchivo = App.Path + "\QR\qr" & VtipoComp & "_4_" & NroQR & ".jpg"
                FE.f1detalleqrtolerancia = 1
                FE.f1detalleqrresolucion = 4
                FE.f1detalleqrformato = 6
                If FE.f1qrGenerar(99) Then
                    'MsgBox ("gráfico generado con los datos. " + FE.f1qrmanualTexto)
                    
                Else
                    MsgBox ("error al generar imagen " + FE.ArchivoQRError + " " + FE.UltimoMensajeError)
                End If

      
      If FE.F1RespuestaDetalleResultado = "R" Then
        MsgBox "Comprobante Rechazado"
        Exit Sub
      Else
        MsgBox ("Factura Generada")

      End If
      'MsgBox ("error local: " + FE.UltimoMensajeError)
      'MsgBox ("ERROR:")
      'ULT = FE.F1CompUltimoAutorizadoS(4, 1)
      'Fecha = FE.F1CompUltimoAutorizadoST
      
      
      'MsgBox ("resultado global AFIP: " + FE.F1RespuestaResultado)
      'MsgBox ("es reproceso? " + FE.F1RespuestaReProceso)
      'MsgBox ("registros procesados por AFIP: " + Str(FE.F1RespuestaCantidadReg))
      'MsgBox ("error genérico global:" + FE.f1ErrorMsg1)
      If FE.F1RespuestaCantidadReg > 0 Then
        'FE.f1Indice = 0
        'MsgBox ("resultado detallado comprobante: " + FE.F1RespuestaDetalleResultado)
        'MsgBox ("cae comprobante: " + FE.F1RespuestaDetalleCae)
        'MsgBox ("número comprobante:" + FE.F1RespuestaDetalleCbteDesdeS)
        'MsgBox ("error detallado comprobante: " + FE.F1RespuestaDetalleObservacionMsg1)
        Exit Sub
      End If
   Else
      MsgBox ("fallo acceso " + FE.UltimoMensajeError)
   End If
Else
   MsgBox ("fallo iniciar " + FE.UltimoMensajeError)
End If

End Sub
Private Sub Genera_FA()
    Set rsEncabFact = db.OpenRecordset("EncabFact")
    Set rsDetFact = db.OpenRecordset("DetFact")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    rsEncabFact.Index = "PrimaryKey"
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    Set rsAsientos = db.OpenRecordset("Asientos")
    'limpia temporales
    Do While Not TrsEncabFact.EOF
        TrsEncabFact.Delete
        TrsEncabFact.MoveNext
    Loop
    Do While Not TrsDetFact.EOF
        TrsDetFact.Delete
        TrsDetFact.MoveNext
    Loop
    'busca número Factura
    lPrimaryKey = GetPrimaryKey
    'graba encabezado en temporales
    With TrsEncabFact
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("Codigo") = Text1(0)
        .Fields("TipoFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNetoFact)
        .Fields("TIVA") = FormatNumber(TIVAFact)
        .Fields("TGral") = FormatNumber(TFact)
        .Update
    End With
    'graba encabezado
    With rsEncabFact
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("Codigo") = Text1(0)
        .Fields("TipoFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNetoFact)
        .Fields("TIVA") = FormatNumber(TIVAFact)
        .Fields("TGral") = FormatNumber(TFact)
        .Update
    End With
    'graba detalle en temporales
    Items = 0
    For Items = Items + 1 To LViajesFact.ListItems.Count
        Set Lista = LViajesFact.ListItems.Item(Items)
        With TrsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("FechaViaje") = Lista.Tag
            .Fields("NroRem") = Lista.SubItems(1)
            .Fields("Chofer") = Lista.SubItems(2)
            .Fields("Mercaderia") = Lista.SubItems(3)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Fields("Alicuota") = "21"
            .Fields("Cupo") = Lista.SubItems(12)
            .Update
        End With
    Next
    'graba detalle de factura
    Items = 0
    For Items = Items + 1 To LViajesFact.ListItems.Count
        Set Lista = LViajesFact.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("FechaViaje") = Lista.Tag
            .Fields("NroRem") = Lista.SubItems(1)
            .Fields("Chofer") = Lista.SubItems(2)
            .Fields("Mercaderia") = Lista.SubItems(3)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Fields("Cupo") = Lista.SubItems(12)
            .Update
        End With
        'actualiza estado de los viajes
        Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroViaje = " & Lista.SubItems(11) & "")
        rsLiqDetViajes.Edit
        rsLiqDetViajes.LockEdits = True
        rsLiqDetViajes.Fields("Facturado") = "SI"
        rsLiqDetViajes.Update
        rsLiqDetViajes.LockEdits = False
    Next
    'GRABA FACTURA EN CTA CTE
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodEmp") = Text1(0)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 1
        .Fields("Debe") = FormatNumber(TFact)
        .Fields("SaldoComp") = FormatNumber(TFact)
        .Update
    End With
    Set rsEncabFact = Nothing
    Set rsDetFact = Nothing
    Set TrsEncabFact = Nothing
    Set TrsDetFact = Nothing
    Set rsCtaCteEmp = Nothing
    'graba asiento coorespondiente
    Set rsAsientos = Nothing
    
    Call Form_Load
    'factura grabada correctamente
    With MsgFact
        .Show
        .Height = 2295
        .Width = 6285
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .NroFact = lPrimaryKey
    End With
End Sub
Private Sub Genera_NC()
    Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 17 order by NroFe")
    Set rsDetFact = db.OpenRecordset("DetFE")
    Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
    Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
    Set rsAsientos = db.OpenRecordset("Asientos")
    'limpia temporales
    Do While Not TrsEncabFact.EOF
        TrsEncabFact.Delete
        TrsEncabFact.MoveNext
    Loop
    Do While Not TrsDetFact.EOF
        TrsDetFact.Delete
        TrsDetFact.MoveNext
    Loop
    'busca número nota de credito
    If Not rsEncabFact.EOF Then
        rsEncabFact.MoveLast
        lPrimaryKey = rsEncabFact.Fields("NroFE") + 1
        NroQR = rsEncabFact.Fields("NroFE") + 1
    Else
        lPrimaryKey = 1
    End If
    'lPrimaryKey = GetPrimaryKey
    VNro = lPrimaryKey
    'GENERA CAE
    'llena variables
    Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 16")
    UltNro = rsComprobantes!UltNro
    FVto = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    FServD = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    FservH = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    FPago = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    VNetoFE = FormatNumber(TNetoFact)
    VivaFE = FormatNumber(TIVAFact)
    FCte = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
    Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(0) & "")
    VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
    VTipoDoc = 80
    VtipoComp = 3
    If rsEncabFact.EOF Then
        VIndice = 0
    Else
        rsEncabFact.MoveLast
        VIndice = rsEncabFact!indice + 1
    End If
    
    With rsEncabFact
        .AddNew
        .Fields("Indice") = VIndice
        .Fields("PtoVtaFE") = 4
        .Fields("NroFE") = lPrimaryKey
        .Fields("FechaFE") = Fecha
        .Fields("CodClie") = Text1(0)
        .Fields("TotalNetoFE") = VNetoFE
        .Fields("TotalIvaFE") = VivaFE
        .Fields("TotalGralFE") = TFact
        .Fields("TipoAfip") = 3
        .Fields("TipoSistema") = 17
        .Fields("FVto") = FVto
        .Fields("FservD") = FServD
        .Fields("FservH") = FservH
        .Fields("FPago") = FPago
        .Fields("ClaseFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión, 3 - Nota de Credito
        Call genera_cae1
        .Fields("CAE") = FE.F1RespuestaDetalleCae
        .Fields("VtoCAE") = FE.F1RespuestaDetalleCAEFchVto
        .Fields("ObsCAE") = FE.F1RespuestaDetalleResultado
        .Fields("MotivoCAE") = FE.F1RespuestaDetalleObservacionMsg
        VRuta = App.Path + "\QR\qr" & VtipoComp & "_4_" & lPrimaryKey & ".jpg"
        .Fields("QR") = VRuta
        .Update
    End With
    'graba encabezado en temporales
    With TrsEncabFact
        .AddNew
        largo = Len(VNro)
        Select Case largo
            Case 1: NRO = "0000000" & lPrimaryKey
            Case 2: NRO = "000000" & lPrimaryKey
            Case 3: NRO = "00000" & lPrimaryKey
            Case 4: NRO = "0000" & lPrimaryKey
            Case 5: NRO = "000" & lPrimaryKey
            Case 6: NRO = "00" & lPrimaryKey
            Case 7: NRO = "0" & lPrimaryKey
            Case 8: NRO = lPrimaryKey
        End Select
        .Fields("NroFact") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("Codigo") = Text1(0)
        .Fields("TipoFact") = 3 '1 - Factura Viajes, 2- Factura de Comisión
        .Fields("TNeto") = FormatNumber(TNetoFact)
        .Fields("TIVA") = FormatNumber(TIVAFact)
        .Fields("TGral") = FormatNumber(TFact)
        .Fields("CAE") = FE.F1RespuestaDetalleCae
        .Fields("ObsCAE") = FE.F1RespuestaDetalleResultado
        DIA = Mid(FE.F1RespuestaDetalleCAEFchVto, 7, 2)
        MES = Mid(FE.F1RespuestaDetalleCAEFchVto, 5, 2)
        AÑO = Mid(FE.F1RespuestaDetalleCAEFchVto, 1, 4)
        FVTOCAE = DIA & "/" & MES & "/" & AÑO
        .Fields("VtoCAE") = FVTOCAE
        .Fields("MotivoCAE") = FE.F1RespuestaDetalleResultado
        .Fields("NroFE") = NRO
        .Fields("PtoVtaFE") = "0004"
        .Fields("Qr") = VRuta
        .Update
    End With
    'graba detalle en temporales
    Items = 0
    For Items = Items + 1 To LViajesFact.ListItems.Count
        Set Lista = LViajesFact.ListItems.Item(Items)
        With TrsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("FechaViaje") = Lista.Tag
            .Fields("NroRem") = Lista.SubItems(1)
            .Fields("Chofer") = Lista.SubItems(2)
            .Fields("Mercaderia") = Lista.SubItems(3)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Update
        End With
    Next
    'graba detalle de factura
    Items = 0
    For Items = Items + 1 To LViajesFact.ListItems.Count
        Set Lista = LViajesFact.ListItems.Item(Items)
        With rsDetFact
            .AddNew
            .Fields("NroFact") = lPrimaryKey
            .Fields("FechaViaje") = Lista.Tag
            .Fields("NroRem") = Lista.SubItems(1)
            .Fields("Chofer") = Lista.SubItems(2)
            .Fields("Mercaderia") = Lista.SubItems(3)
            .Fields("Procedencia") = Lista.SubItems(4)
            .Fields("Destino") = Lista.SubItems(5)
            .Fields("Kilos") = Lista.SubItems(6)
            .Fields("Tarifa") = Lista.SubItems(7)
            .Fields("STotal") = Lista.SubItems(8)
            .Fields("TipoComp") = VtipoComp
            .Update
        End With
    Next

   ''''''''''''''''''''''''''
    'GRABA FACTURA EN CTA CTE
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodEmp") = Text1(0)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 2
        .Fields("Haber") = FormatNumber(TFact)
        .Fields("SaldoComp") = FormatNumber(TFact)
        .Update
    End With
    'aplica a factura
    Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where NroComp = " & Viaje(10) & "")
    rsCtaCteEmp.Edit
    rsCtaCteEmp.LockEdits = True
    rsCtaCteEmp!SaldoComp = FormatNumber(rsCtaCteEmp!SaldoComp - TFact)
    rsCtaCteEmp.Update
    rsCtaCteEmp.LockEdits = False
    Set rsEncabFact = Nothing
    Set rsDetFact = Nothing
    Set TrsEncabFact = Nothing
    Set TrsDetFact = Nothing
    Set rsCtaCteEmp = Nothing
    'graba asiento coorespondiente
    Set rsAsientos = Nothing
    
    Call Form_Load
    'factura grabada correctamente
    With MsgFact
        .Show
        .Height = 2295
        .Width = 6285
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .NroFact = lPrimaryKey
    End With
End Sub
Private Sub Genera_LP()
On Error Resume Next
Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 60 order by NroFe")
Set rsDetFact = db.OpenRecordset("DetFE")
Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
Set rsAsientos = db.OpenRecordset("Asientos")
'limpia temporales
Do While Not TrsEncabFact.EOF
    TrsEncabFact.Delete
    TrsEncabFact.MoveNext
Loop
Do While Not TrsDetFact.EOF
    TrsDetFact.Delete
    TrsDetFact.MoveNext
Loop
VNro = Text1(11)
Set rsEncabFact = Nothing
Set rsEncabFact = db.OpenRecordset("EncabFE")
If rsEncabFact.EOF Then
    VIndice = 0
Else
    rsEncabFact.MoveLast
    VIndice = rsEncabFact!indice + 1
End If
    
With rsEncabFact
    .AddNew
    .Fields("Indice") = VIndice
    .Fields("PtoVtaFE") = Text1(10)
    .Fields("NroFE") = Text1(11)
    .Fields("FechaFE") = Fecha
    .Fields("CodClie") = Text1(0)
    .Fields("TotalNetoFE") = FormatNumber(TNetoFact)
    .Fields("TotalIvaFE") = FormatNumber(TIVAFact)
    .Fields("TotalGralFE") = FormatNumber(TFact)
    .Fields("TipoAfip") = 1
    .Fields("TipoSistema") = 60
    .Fields("ClaseFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
    .Fields("Emp_Flet") = 0
    .Update
End With
'graba encabezado en temporales
With TrsEncabFact
    .AddNew
    largo = Len(VNro)
    Select Case largo
        Case 1: NRO = "0000000" & VNro
        Case 2: NRO = "000000" & VNro
        Case 3: NRO = "00000" & VNro
        Case 4: NRO = "0000" & VNro
        Case 5: NRO = "000" & VNro
        Case 6: NRO = "00" & VNro
        Case 7: NRO = "0" & VNro
        Case 8: NRO = VNro
    End Select
    .Fields("NroFact") = Text1(11)
    .Fields("Fecha") = Fecha
    .Fields("Codigo") = Text1(0)
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1(0) & "")
        .Fields("DescClie") = rsEmpresas!DescEmpresas
        .Fields("DirClie") = rsEmpresas!Direccion
        .Fields("LocCLie") = rsEmpresas!Localidad
        .Fields("CuitClie") = rsEmpresas!cuit
    .Fields("TipoFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
    .Fields("TNeto") = FormatNumber(TNetoFact)
    .Fields("TIVA") = FormatNumber(TIVAFact)
    .Fields("TGral") = FormatNumber(TFact)
    .Fields("NroFE") = NRO
    VNro = Text1(10)
    largo = Len(VNro)
    Select Case largo
        Case 1: NRO = "0000000" & VNro
        Case 2: NRO = "000000" & VNro
        Case 3: NRO = "00000" & VNro
        Case 4: NRO = "0000" & VNro
        Case 5: NRO = "000" & VNro
        Case 6: NRO = "00" & VNro
        Case 7: NRO = "0" & VNro
        Case 8: NRO = VNro
    End Select
    .Fields("PtoVtaFE") = VNro
    .Update
End With
'graba detalle en temporales
Items = 0
For Items = Items + 1 To LViajesFact.ListItems.Count
    Set Lista = LViajesFact.ListItems.Item(Items)
    With TrsDetFact
        .AddNew
        .Fields("NroFact") = Text1(11)
        .Fields("FechaViaje") = Lista.Tag
        .Fields("NroRem") = Lista.SubItems(1)
        .Fields("Chofer") = Lista.SubItems(2)
        .Fields("Mercaderia") = Lista.SubItems(3)
        .Fields("Procedencia") = Lista.SubItems(4)
        .Fields("Destino") = Lista.SubItems(5)
        .Fields("Kilos") = Lista.SubItems(6)
        .Fields("Tarifa") = Lista.SubItems(7)
        .Fields("STotal") = Lista.SubItems(8)
        .Fields("Cupo") = Lista.SubItems(12)
        .Update
    End With
Next
'graba detalle de factura
Items = 0
For Items = Items + 1 To LViajesFact.ListItems.Count
    Set Lista = LViajesFact.ListItems.Item(Items)
    With rsDetFact
        .AddNew
        .Fields("NroFact") = Text1(11)
        .Fields("FechaViaje") = Lista.Tag
        .Fields("NroRem") = Lista.SubItems(1)
        .Fields("Chofer") = Lista.SubItems(2)
        .Fields("Mercaderia") = Lista.SubItems(3)
        .Fields("Procedencia") = Lista.SubItems(4)
        .Fields("Destino") = Lista.SubItems(5)
        .Fields("Kilos") = Lista.SubItems(6)
        .Fields("Tarifa") = Lista.SubItems(7)
        .Fields("STotal") = Lista.SubItems(8)
        .Fields("TipoComp") = 60
        .Fields("Alicuota") = "21"
        .Fields("Cupo") = Lista.SubItems(12)
        .Update
    End With
Next
    'GRABA FACTURA EN CTA CTE
Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
With rsCtaCteEmp
    .AddNew
    .Fields("Fecha") = Fecha
    .Fields("CodEmp") = Text1(0)
    .Fields("PtoVta") = Text1(10)
    .Fields("NroComp") = Text1(11)
    .Fields("TipoComp") = 60
    .Fields("Debe") = FormatNumber(TFact)
    .Fields("SaldoComp") = FormatNumber(TFact)
    .Update
End With
        
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsCtaCteEmp = Nothing
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsCtaCteEmp = Nothing
'graba asiento coorespondiente
Set rsAsientos = Nothing
    
Call Form_Load
'factura grabada correctamente
'Dim frmRep As New InfLiqProd
'frmRep.Show vbModal

End Sub
Private Sub Genera_FE()
On Error Resume Next
Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 16 and PtoVtaFE = " & VVPtoVta & " order by NroFe")
Set rsDetFact = db.OpenRecordset("DetFE")
Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
Set rsAsientos = db.OpenRecordset("Asientos")
'limpia temporales
'busca número Factura
 
 If rsEncabFact.EOF Then
    lPrimaryKey = 1
    NroQR = 1
    VNro = 1
Else
    rsEncabFact.MoveLast
    lPrimaryKey = rsEncabFact.Fields("NroFE") + 1
    NroQR = rsEncabFact.Fields("NroFE") + 1
    VNro = lPrimaryKey
End If
'lPrimaryKey = GetPrimaryKey


'GENERA CAE
'llena variables
Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 16")
UltNro = rsComprobantes!UltNro
FVto = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FServD = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FservH = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FPago = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
VNetoFE = FormatNumber(TNetoFact)
VivaFE = FormatNumber(TIVAFact)
FCte = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(0) & "")
VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
VTipoDoc = 80
VtipoComp = 1

Set rsEncabFact = Nothing
Set rsEncabFact = db.OpenRecordset("EncabFE")
If rsEncabFact.EOF Then
    VIndice = 0
Else
    rsEncabFact.MoveLast
    VIndice = rsEncabFact!indice + 1
End If
    
With rsEncabFact
    .AddNew
    .Fields("Indice") = VIndice
    .Fields("PtoVtaFE") = VVPtoVta
    .Fields("NroFE") = lPrimaryKey
    .Fields("FechaFE") = Fecha
    .Fields("CodClie") = Text1(0)
    .Fields("TotalNetoFE") = FormatNumber(VNetoFE)
    .Fields("TotalIvaFE") = FormatNumber(TIVAFact)
    .Fields("TotalGralFE") = FormatNumber(TFact)
    .Fields("TipoAfip") = 1
    .Fields("TipoSistema") = 16
    .Fields("FVto") = FVto
    .Fields("FservD") = FServD
    .Fields("FservH") = FservH
    .Fields("FPago") = FPago
    .Fields("ClaseFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
    .Fields("Emp_Flet") = 0
    .Update
End With
'graba detalle de factura
Items = 0
For Items = Items + 1 To LViajesFact.ListItems.Count
    Set Lista = LViajesFact.ListItems.Item(Items)
    With rsDetFact
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("PtoVta") = VVPtoVta
        .Fields("FechaViaje") = Lista.Tag
        .Fields("NroRem") = Lista.SubItems(1)
        .Fields("Chofer") = Lista.SubItems(2)
        .Fields("Mercaderia") = Lista.SubItems(3)
        .Fields("Procedencia") = Lista.SubItems(4)
        .Fields("Destino") = Lista.SubItems(5)
        .Fields("Kilos") = Lista.SubItems(6)
        .Fields("Tarifa") = Lista.SubItems(7)
        .Fields("STotal") = Lista.SubItems(8)
        .Fields("TipoComp") = VtipoComp
        .Fields("Alicuota") = "21"
        .Fields("Cupo") = Lista.SubItems(12)
        .Update
    End With
    'actualiza estado de los viajes
    Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroViaje = " & Lista.SubItems(11) & " and NroRemito = '" & Lista.SubItems(1) & "'")
    rsLiqDetViajes.Edit
    rsLiqDetViajes.LockEdits = True
    rsLiqDetViajes.Fields("Facturado") = "SI"
    rsLiqDetViajes.Fields("FacturadoEn") = VtipoComp & "  / " & VVPtoVta & "-" & lPrimaryKey
    rsLiqDetViajes.Update
    rsLiqDetViajes.LockEdits = False
Next
    'GRABA FACTURA EN CTA CTE
Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
With rsCtaCteEmp
    .AddNew
    .Fields("Fecha") = Fecha
    .Fields("CodEmp") = Text1(0)
    .Fields("PtoVta") = VVPtoVta
    .Fields("NroComp") = lPrimaryKey
    .Fields("TipoComp") = 16
    .Fields("Debe") = FormatNumber(TFact)
    .Fields("SaldoComp") = FormatNumber(TFact)
    .Update
End With
        
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsCtaCteEmp = Nothing
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsCtaCteEmp = Nothing
'graba asiento coorespondiente
Set rsAsientos = Nothing
    
Call Form_Load
'factura grabada correctamente
End Sub
Private Sub Aceptar_Click()
On Error GoTo ERR_cmdGrabarFact
Dim lPrimaryKey As Long
Dim sMessage As String
If TNetoFact = 0 Then
    MsgBox "DEBE CARGAR AL MENOS 1 VIAJE "
    Exit Sub
End If
If Comprobante.ListIndex = 0 Then
    Call Genera_FA
    Exit Sub
End If
'nota de credito
If Comprobante.ListIndex = 2 Then
    Call Genera_NC
    Exit Sub
End If
' factura electronica
If Comprobante.ListIndex = 3 Then
    Call Genera_FE
    Exit Sub
End If
' liquido producto
If Comprobante.ListIndex = 4 Then
    Call Genera_LP
    Exit Sub
End If
' factura Pyme
If Comprobante.ListIndex = 5 Then
    'If Not TNetoFact < 170000 Then
        Call FAPyme
        Exit Sub
    'Else
     '   MsgBox "El monto es inferior al permitido en una factura Pyme"
      '  Exit Sub
    'End If
End If
MsgBox "Comprobante Generado Correctamente"
Exit Sub
ERR_cmdGrabarFact:
    TableError Err
    Set rsEncabFact = Nothing
    Set rsDetFact = Nothing
    Set TrsEncabFact = Nothing
    Set TrsDetFact = Nothing
End Sub
Private Function FAPyme()
On Error Resume Next
Dim FVTO1 As Date
Dim cALetra As New clsNum2Let
Set rsEncabFact = db.OpenRecordset("Select * from EncabFE Where TipoSistema = 201 and PtoVtaFE = " & VVPtoVta & " order by NroFe")
Set rsDetFact = db.OpenRecordset("DetFE")
Set TrsEncabFact = dbTemp.OpenRecordset("EncabFact")
Set TrsDetFact = dbTemp.OpenRecordset("DetFact")
Set rsAsientos = db.OpenRecordset("Asientos")
'busca número Factura
 rsEncabFact.MoveLast
If Not rsEncabFact.EOF Then
    lPrimaryKey = rsEncabFact.Fields("NroFE") + 1
    NroQR = rsEncabFact.Fields("NroFE") + 1
    VNro = lPrimaryKey
Else
    lPrimaryKey = 1
    NroQR = 1
    VNro = 1
End If
'lPrimaryKey = GetPrimaryKey

'GENERA CAE
'llena variables
'Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 201")
'UltNro = rsComprobantes!UltNro
If OPFPago.ListIndex = 0 Then
    FVTO1 = DateAdd("m", 1, Fecha)
ElseIf OPFPago.ListIndex = 1 Then
    FVTO1 = DateAdd("m", 2, Fecha)
ElseIf OPFPago.ListIndex = 2 Then
    FVTO1 = DateAdd("m", 3, Fecha)
End If
FVto = Mid(FVTO1, 7, 4) & Mid(FVTO1, 4, 2) & Mid(FVTO1, 1, 2)
FServD = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FservH = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
FPago = Mid(FVTO1, 7, 4) & Mid(FVTO1, 4, 2) & Mid(FVTO1, 1, 2)
VNetoFE = FormatNumber(TNetoFact)
VivaFE = FormatNumber(TIVAFact)
FCte = Mid(Fecha, 7, 4) & Mid(Fecha, 4, 2) & Mid(Fecha, 1, 2)
Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(0) & "")
VCUIT = Mid(rsEmpresas!cuit, 1, 2) & Mid(rsEmpresas!cuit, 4, 8) & Mid(rsEmpresas!cuit, 13, 1)
VTipoDoc = 80
VtipoComp = 201

Set rsEncabFact = Nothing
Set rsEncabFact = db.OpenRecordset("EncabFE")
If rsEncabFact.EOF Then
    VIndice = 0
Else
    rsEncabFact.MoveLast
    VIndice = rsEncabFact!indice + 1
End If
    
With rsEncabFact
    .AddNew
    .Fields("Indice") = VIndice
    .Fields("PtoVtaFE") = VVPtoVta
    .Fields("NroFE") = lPrimaryKey
    .Fields("FechaFE") = Fecha
    .Fields("CodClie") = Text1(0)
    .Fields("TotalNetoFE") = FormatNumber(VNetoFE)
    .Fields("TotalIvaFE") = FormatNumber(TIVAFact)
    .Fields("TotalGralFE") = FormatNumber(TFact)
    .Fields("TipoAfip") = 201
    .Fields("TipoSistema") = 201
    .Fields("FVto") = FVto
    .Fields("FservD") = FServD
    .Fields("FservH") = FservH
    .Fields("FPago") = FPago
    .Fields("ClaseFact") = 1 '1 - Factura Viajes, 2- Factura de Comisión
    If Combo1.ListIndex = 0 Then
        .Fields("Agente") = "SCA"
    Else
        .Fields("Agente") = "ADC"
    End If
    .Fields("Emp_Flet") = 0
    cALetra.Numero = Val(TFact)
    Impletra = justificarTextoFMiPyme(cALetra.ALetra, 250, 0)
    .Fields("ImpLetras") = Impletra
    .Update
End With
'graba detalle de factura
Items = 0
For Items = Items + 1 To LViajesFact.ListItems.Count
    Set Lista = LViajesFact.ListItems.Item(Items)
    With rsDetFact
        .AddNew
        .Fields("NroFact") = lPrimaryKey
        .Fields("PtoVta") = VVPtoVta
        .Fields("FechaViaje") = Lista.Tag
        .Fields("NroRem") = Lista.SubItems(1)
        .Fields("Chofer") = Lista.SubItems(2)
        .Fields("Mercaderia") = Lista.SubItems(3)
        .Fields("Procedencia") = Lista.SubItems(4)
        .Fields("Destino") = Lista.SubItems(5)
        .Fields("Kilos") = Lista.SubItems(6)
        .Fields("Tarifa") = Lista.SubItems(7)
        .Fields("STotal") = Lista.SubItems(8)
        .Fields("TipoComp") = VtipoComp
        .Fields("Alicuota") = "21"
        .Fields("Cupo") = Lista.SubItems(12)
        .Update
    End With
    'actualiza estado de los viajes
    Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroViaje = " & Lista.SubItems(11) & " and NroRemito = '" & Lista.SubItems(1) & "'")
    rsLiqDetViajes.Edit
    rsLiqDetViajes.LockEdits = True
    rsLiqDetViajes.Fields("Facturado") = "SI"
    rsLiqDetViajes.Fields("FacturadoEn") = VtipoComp & "  / " & VVPtoVta & "-" & lPrimaryKey
    
    rsLiqDetViajes.Update
    rsLiqDetViajes.LockEdits = False
Next
    'GRABA FACTURA EN CTA CTE
Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
With rsCtaCteEmp
    .AddNew
    .Fields("Fecha") = Fecha
    .Fields("CodEmp") = Text1(0)
    .Fields("PtoVta") = VVPtoVta
    .Fields("NroComp") = lPrimaryKey
    .Fields("TipoComp") = 201
    .Fields("Debe") = FormatNumber(TFact)
    .Fields("SaldoComp") = FormatNumber(TFact)
    .Update
End With
        
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsCtaCteEmp = Nothing
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsCtaCteEmp = Nothing
'graba asiento coorespondiente
Set rsAsientos = Nothing
    
Call Form_Load
'factura grabada correctamente
End Function
Private Function TableError(oErr As ErrObject) As Boolean
    Dim sMessage As String
    Dim nResponse As Integer
    ' estos son los cuatro códigos de error que se gestionarán especialmente
    ' dentro de esta función
    Const TB_OPEN = 3262            ' tabla ya abierta en modo compartido
    Const TB_IN_USE = 3261          ' tabla ya abierta en modo exclusivo
    Const TB_READ_ONLY = 3027       ' no se puede actualizar, sólo lectura
    Const TB_LOCKED = 3186          ' tabla bloqueada, no se puede actualizar
    Const DB_IN_USE = 3045  ' la base ya está abierta en modo exclusivo
    
    ' De manera predeterminada se asigna False como retorno de la función
    ' que significa que no se quiere volver a intentar
    TableError = False
    
    With oErr
        ' selecciona el código dependiendo del error
        Select Case .Number
            ' la tabla no pudo ser abierta en el modo requerido
            ' se pregunta al usuario si se quiere abrir en modo lectura
            Case TB_OPEN, TB_IN_USE:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
                'Exit Function
            ' la tabla es sólo lectura y no se pueden agregar registros
            Case TB_READ_ONLY:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está abierta de sólo lectura. "
                         
            ' la tabla está bloqueada y no se pueden agregar registros
            Case TB_LOCKED:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
            ' otro tipo de error: se visualiza el número y la descripción
            Case DB_IN_USE
                SMSSAGE = "ABIERTA EN FORMA ESCLUSIVA POR OTRO USUARIO"
                ' del error
            Case Else
                sMessage = "Error #" & .Number & ": " & .Description
        End Select
    End With
    ' visualiza el mensaje de error
    MsgBox sMessage, vbExclamation, "TABLA ERROR"
    
    ' ha habido un error y nos aseguramos que la tabla queda cerrada
    ' y en la pantalla quedan las etiquetas adecuadas
    'Set rs = Nothing
End Function

Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabFact
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroFE") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function

Private Sub Cancelar_Click()
Form_Initialize
Form_Load
End Sub

Private Sub Command1_Click()
On Error Resume Next
Set rsLiqDetViajes = db.OpenRecordset("LiqDetViajes")

Do While Not rsLiqDetViajes.EOF
    If IsNull(rsLiqDetViajes!Facturado) Then
    'MsgBox rsLiqDetViajes!NroRemito
    rsLiqDetViajes.Edit
    rsLiqDetViajes.Fields("Facturado") = "SI"
    rsLiqDetViajes.Update
    End If
    rsLiqDetViajes.MoveNext
Loop

Exit Sub
Set rsDetFact = db.OpenRecordset("DetFE")
Do While Not rsDetFact.EOF
    Set rsEncabFact = db.OpenRecordset("Select * From EncabFE Where NroFE = " & rsDetFact!NroFact & " And TipoAfip = " & rsDetFact!TipoComp & "")
    If Not rsDetFact!TipoComp = 203 Then
    Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroRemito = '" & rsDetFact!NroRem & "' And CodEmpresa = " & rsEncabFact!CodClie & "")
    Do While Not rsLiqDetViajes.EOF
        rsLiqDetViajes.Edit
        rsLiqDetViajes.Fields("Facturado") = SI
        rsLiqDetViajes.Fields("FacturadoEn") = rsDetFact!TipoComp & "  / " & rsEncabFact!PtoVtaFE & "-" & rsEncabFact!NroFE
        rsLiqDetViajes.Update
        rsLiqDetViajes.MoveNext
    Loop
    End If
    rsDetFact.MoveNext
    
Loop
End Sub

Private Sub Command2_Click()
Set rsDetFact = db.OpenRecordset("Select * From AplicRec Where Ptovta = 1")
Do While Not rsDetFact.EOF
    rsDetFact.Edit
    rsDetFact.Fields("PtoVta") = 4
    rsDetFact.Update
    rsDetFact.MoveNext
Loop
End Sub

Private Sub Comprobante_LostFocus()
If Comprobante.ListIndex = 4 Then
    Label1(7).Visible = True
    Text1(10).Visible = True
    Text1(11).Visible = True
    Frame1.Visible = False
End If
If Comprobante.ListIndex = 5 Or Comprobante.ListIndex = 6 Or Comprobante.ListIndex = 7 Then
   OPFPago.Visible = True
   OPFPago.ListIndex = 0
   Label1(16).Visible = True
   Combo1.Visible = True
   Combo1.ListIndex = 0
   Label1(17).Visible = True
Else
    OPFPago.Visible = False
   OPFPago.ListIndex = 0
   Label1(16).Visible = False
   Combo1.Visible = False
   Combo1.ListIndex = 0
   Label1(17).Visible = False
End If
End Sub

Private Sub Form_Initialize()
Set rsEncabFact = Nothing
Set rsDetFact = Nothing
Set TrsEncabFact = Nothing
Set TrsDetFact = Nothing
Set rsEmpresas = Nothing
Set rsLiqDetViajes = Nothing
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call BuscarEmpresa
Case vbKeyF5: Call Aceptar_Click
End Select
End Sub
Private Sub BuscarEmpresa()
 With BuscEmpresas
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "FactViajes"
    End With
End Sub
Private Sub Form_Load()
On Error Resume Next
Option1(0).Value = True
VVPtoVta = 4
Comprobante.Clear
Comprobante.AddItem ("Factura")
Comprobante.AddItem ("Nota de Debito")
Comprobante.AddItem ("Nota de Credito")
Comprobante.AddItem ("Factura Electronica")
Comprobante.AddItem ("Liquido Producto")
Comprobante.AddItem ("Factura Pyme")

Comprobante.ListIndex = 3
OPFPago.Clear
OPFPago.AddItem ("30 días FF")
OPFPago.AddItem ("60 días FF")
OPFPago.AddItem ("90 días FF")
OPFPago.Visible = False
Combo1.Clear
Combo1.AddItem ("Trans Sist Circulacion Abierta")
Combo1.AddItem ("Agente de Deposito Colectivo")
Combo1.Visible = False

Items = 0
For Items = Items + 1 To Text1.Count
    If Items >= 4 And Items <= 6 Then
        Text1(Items - 1) = "0.00"
    Else
        Text1(Items - 1) = ""
    End If
Next
Items = 0
For Items = Items + 1 To Viaje.Count
    If Not Items = 7 Then
    Viaje(Items - 1).Caption = ""
    End If
Next
Fecha.Mask = "##/##/####"
Fecha = Date
TFact = 0: TNetoFact = 0: TIVAFact = 0
LViajesFact.ListItems.Clear
ListaViajes.ListItems.Clear
Label1(16).Visible = False
Label1(17).Visible = False
End Sub

Private Sub ListaViajes_DblClick()
On Error Resume Next
Set Lista = ListaViajes.ListItems.Item(ListaViajes.SelectedItem.Index)
If Not Lista.ListSubItems.Count = 0 Then
    Viaje(0) = Lista.Tag: Viaje(1) = Lista.SubItems(1): Viaje(2) = Lista.SubItems(2)
    Viaje(3) = Lista.SubItems(3): Text1(8) = Lista.SubItems(4): Text1(7) = Lista.SubItems(5)
    Text1(6) = Lista.SubItems(6): Text1(2) = Lista.SubItems(7): Viaje(7) = Lista.SubItems(8)
    Viaje(8) = Lista.SubItems(9): Viaje(9) = Lista.SubItems(10): Viaje(10) = Lista.SubItems(11)
    Text1(9) = Lista.SubItems(12)
    
    ListaViajes.ListItems.Remove (ListaViajes.SelectedItem.Index)
End If

End Sub

Private Sub OkViajes_Click()
If Not Text1(2) = "" Then
    
        Set Lista = LViajesFact.ListItems.Add(, , Viaje(0))
        Lista.Tag = Viaje(0)
        Lista.SubItems(1) = Viaje(1)
        Lista.SubItems(2) = Viaje(2)
        Lista.SubItems(3) = Viaje(3)
        Lista.SubItems(4) = Text1(8)
        Lista.SubItems(5) = Text1(7)
        Lista.SubItems(6) = Text1(6)
        Lista.SubItems(7) = FormatNumber(Text1(2))
        Lista.SubItems(8) = Viaje(7)
        Lista.SubItems(9) = Viaje(8)
        Lista.SubItems(10) = Viaje(9)
        Lista.SubItems(11) = Viaje(10)
        Lista.SubItems(12) = Text1(9)
        TNetoFact = TNetoFact + Viaje(7)
        TIVAFact = TNetoFact * 21 / 100
        TFact = TIVAFact + TNetoFact
        Text1(3) = FormatNumber(TNetoFact)
        Text1(4) = FormatNumber(TIVAFact)
        Text1(5) = FormatNumber(TFact)
        Items = 0
        For Items = Items + 1 To Viaje.Count
            If Not Items = 7 Then
            Viaje(Items - 1) = ""
            End If
        Next
        Text1(2) = ""
        Text1(6) = ""
        Text1(9) = ""
        Text1(7) = ""
        Text1(8) = ""
   
End If
End Sub

Private Sub Option1_Click(Index As Integer)
Select Case Index
    Case 0: Option1(0).Value = True
            Option1(1).Value = False
            VVPtoVta = 4
    Case 1: Option1(0).Value = False
            Option1(1).Value = True
            VVPtoVta = 5
End Select
End Sub

Private Sub Text1_Change(Index As Integer)
On Error Resume Next
Select Case Index
    Case 2, 6:
        Dim VStotal As Double
        If Not Comprobante.ListIndex = 4 Then
            
            If Not Text1(2) = "" And Not Text1(6) = "" Then
                VStotal = (Text1(6) / 1000) * Text1(2)
                Viaje(7) = FormatNumber(VStotal)
            End If
        Else
            If Not Text1(2) = "" And Not Text1(6) = "" Then
                VStotal = (Text1(6) / 1000) * Text1(2)
                Viaje(7) = FormatNumber(VStotal)
            End If
        End If
End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
'On Error Resume Next
Select Case Index
    Case 0, 5, 6, 7:
        If Not Text1(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas WHERE CodEmpresas = " & Text1(0) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text1(1) = rsEmpresas!DescEmpresas
                If Comprobante.ListIndex = 0 Or Comprobante.ListIndex = 3 Or Comprobante.ListIndex = 4 Or Comprobante.ListIndex = 5 Then
                    Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE CodEmpresa = " & Text1(0) & " AND Facturado = 'NO' ORDER BY Fecha")
                    ListaViajes.ListItems.Clear
                    Do While Not rsLiqDetViajes.EOF
                        If Option1(0).Value = True Then
                            If Not rsLiqDetViajes!codflet = 1107 Then
                                Set Lista = ListaViajes.ListItems.Add(, , rsLiqDetViajes!Fecha)
                                Lista.Tag = rsLiqDetViajes!Fecha
                                Lista.SubItems(1) = rsLiqDetViajes!NroRemito
                                Lista.SubItems(2) = rsLiqDetViajes!DescChofer
                                Lista.SubItems(3) = rsLiqDetViajes!mERCADERIA
                                Lista.SubItems(4) = rsLiqDetViajes!pROCEDENCIA
                                Lista.SubItems(5) = rsLiqDetViajes!dESTINO
                                Lista.SubItems(6) = FormatNumber(rsLiqDetViajes!kilos)
                                Lista.SubItems(7) = FormatNumber(rsLiqDetViajes!tarifa)
                                Lista.SubItems(8) = FormatNumber(rsLiqDetViajes!sUBTOTAL)
                                Lista.SubItems(9) = rsLiqDetViajes!CodEmpresa
                                Lista.SubItems(10) = rsLiqDetViajes!CodChofer
                                Lista.SubItems(11) = rsLiqDetViajes!NroViaje
                                If Not IsNull(rsLiqDetViajes!Cupo) Then
                                    Lista.SubItems(12) = rsLiqDetViajes!Cupo
                                End If
                            End If
                        Else
                            If rsLiqDetViajes!codflet = 1107 Then
                                Set Lista = ListaViajes.ListItems.Add(, , rsLiqDetViajes!Fecha)
                                Lista.Tag = rsLiqDetViajes!Fecha
                                Lista.SubItems(1) = rsLiqDetViajes!NroRemito
                                Lista.SubItems(2) = rsLiqDetViajes!DescChofer
                                Lista.SubItems(3) = rsLiqDetViajes!mERCADERIA
                                Lista.SubItems(4) = rsLiqDetViajes!pROCEDENCIA
                                Lista.SubItems(5) = rsLiqDetViajes!dESTINO
                                Lista.SubItems(6) = FormatNumber(rsLiqDetViajes!kilos)
                                Lista.SubItems(7) = FormatNumber(rsLiqDetViajes!tarifa)
                                Lista.SubItems(8) = FormatNumber(rsLiqDetViajes!sUBTOTAL)
                                Lista.SubItems(9) = rsLiqDetViajes!CodEmpresa
                                Lista.SubItems(10) = rsLiqDetViajes!CodChofer
                                Lista.SubItems(11) = rsLiqDetViajes!NroViaje
                                If Not IsNull(rsLiqDetViajes!Cupo) Then
                                    Lista.SubItems(12) = rsLiqDetViajes!Cupo
                                End If
                            End If
                        End If
                        rsLiqDetViajes.MoveNext
                    Loop
                    Set rsLiqDetViajes = Nothing
                   
                End If
                If Comprobante.ListIndex = 2 Then
                    Set rsEncabFact = db.OpenRecordset("Select * From EncabFact Where Codigo = " & Text1(0) & " and TipoFact = 1")
                    Do While Not rsEncabFact.EOF
                        Set rsDetFact = db.OpenRecordset("Select * From DetFact Where NroFact = " & rsEncabFact!NroFact & "")
                        Do While Not rsDetFact.EOF
                             Set Lista = ListaViajes.ListItems.Add(, , rsDetFact!FechaViaje)
                                Lista.Tag = rsDetFact!FechaViaje
                                Lista.SubItems(1) = rsDetFact!NroRem
                                Lista.SubItems(2) = rsDetFact!Chofer
                                Lista.SubItems(3) = rsDetFact!mERCADERIA
                                Lista.SubItems(4) = rsDetFact!pROCEDENCIA
                                Lista.SubItems(5) = rsDetFact!dESTINO
                                Lista.SubItems(6) = rsDetFact!kilos
                                Lista.SubItems(7) = rsDetFact!tarifa
                                Lista.SubItems(8) = rsDetFact.Fields("STotal")
                            rsDetFact.MoveNext
                        Loop
                        rsEncabFact.MoveNext
                    Loop
                    Set rsEncabFact = Nothing
                    Set rsDetFact = Nothing
                End If
            Else
                    MsgBox "La empresas no existe"
                    Text1(0).SetFocus
            End If
            Set rsEmpresas = Nothing
        Else
            ListaViajes.ListItems.Clear
            Text1(1) = ""
        End If
End Select
End Sub

