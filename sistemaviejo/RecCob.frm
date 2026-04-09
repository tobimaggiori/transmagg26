VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form RecCob 
   BackColor       =   &H80000007&
   Caption         =   "Recibo por Cobranza"
   ClientHeight    =   8445
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   9540
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   8445
   ScaleWidth      =   9540
   Begin VB.CommandButton AplicaRec 
      Caption         =   "Aplica todos los recibos de una empresa"
      Height          =   735
      Left            =   7200
      TabIndex        =   61
      Top             =   6960
      Visible         =   0   'False
      Width           =   1695
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   7680
      TabIndex        =   1
      Top             =   480
      Width           =   1695
      _ExtentX        =   2990
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      ForeColor       =   &H00000000&
      Height          =   285
      Left            =   1200
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   480
      Width           =   1095
   End
   Begin KewlButtonz.KewlButtons Efectivo 
      Height          =   615
      Left            =   480
      TabIndex        =   2
      Top             =   1080
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Efectivo"
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
      MICON           =   "RecCob.frx":0000
      PICN            =   "RecCob.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons KewlButtons1 
      Height          =   615
      Left            =   2160
      TabIndex        =   3
      Top             =   1080
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Cheques"
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
      MICON           =   "RecCob.frx":0336
      PICN            =   "RecCob.frx":0352
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons AplicarFact 
      Height          =   615
      Left            =   5520
      TabIndex        =   4
      Top             =   1080
      Width           =   1695
      _ExtentX        =   2990
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Aplicar a Facturas"
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
      MICON           =   "RecCob.frx":066C
      PICN            =   "RecCob.frx":0688
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons KewlButtons2 
      Height          =   615
      Left            =   3840
      TabIndex        =   29
      Top             =   1080
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Otros Concepto"
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
      MICON           =   "RecCob.frx":09A2
      PICN            =   "RecCob.frx":09BE
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Agregar 
      Height          =   615
      Left            =   7320
      TabIndex        =   51
      Top             =   1080
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   1085
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
      MICON           =   "RecCob.frx":0CD8
      PICN            =   "RecCob.frx":0CF4
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.TextBox Text5 
      Alignment       =   2  'Center
      Appearance      =   0  'Flat
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   285
      Index           =   0
      Left            =   4920
      TabIndex        =   20
      Text            =   "Text5"
      Top             =   7080
      Width           =   1695
   End
   Begin VB.TextBox Text5 
      Alignment       =   2  'Center
      Appearance      =   0  'Flat
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      Height          =   285
      Index           =   1
      Left            =   4920
      TabIndex        =   22
      Text            =   "Text5"
      Top             =   6600
      Width           =   1695
   End
   Begin VB.TextBox Text5 
      Alignment       =   2  'Center
      Appearance      =   0  'Flat
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H000000FF&
      Height          =   285
      Index           =   2
      Left            =   4920
      TabIndex        =   23
      Text            =   "Text5"
      Top             =   7560
      Width           =   1695
   End
   Begin VB.Frame Frame3 
      BackColor       =   &H80000007&
      Caption         =   "Aplicar Facturas"
      ForeColor       =   &H000080FF&
      Height          =   4455
      Left            =   360
      TabIndex        =   52
      Top             =   1920
      Width           =   8655
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   5
         Left            =   6840
         TabIndex        =   63
         Text            =   "Text4"
         Top             =   2280
         Visible         =   0   'False
         Width           =   855
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   4
         Left            =   5880
         TabIndex        =   62
         Text            =   "Text4"
         Top             =   2280
         Visible         =   0   'False
         Width           =   855
      End
      Begin MSComctlLib.ListView Fact_Aplic 
         Height          =   1695
         Left            =   720
         TabIndex        =   59
         Top             =   2400
         Width           =   5055
         _ExtentX        =   8916
         _ExtentY        =   2990
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
         NumItems        =   5
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Numero"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Aplicado"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "PtoVta"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "TipoComp"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.CommandButton Command1 
         Caption         =   "Aplicar"
         Height          =   255
         Left            =   5880
         TabIndex        =   58
         Top             =   1920
         Width           =   975
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   3
         Left            =   4800
         TabIndex        =   57
         Text            =   "Text4"
         Top             =   1920
         Width           =   975
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   2
         Left            =   3720
         TabIndex        =   56
         Text            =   "Text4"
         Top             =   1920
         Width           =   975
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   1
         Left            =   1800
         TabIndex        =   55
         Text            =   "Text4"
         Top             =   1920
         Width           =   1815
      End
      Begin VB.TextBox Text4 
         Height          =   285
         Index           =   0
         Left            =   720
         TabIndex        =   54
         Text            =   "Text4"
         Top             =   1920
         Width           =   975
      End
      Begin MSComctlLib.ListView List_FactPend 
         Height          =   1455
         Left            =   720
         TabIndex        =   53
         Top             =   360
         Width           =   4995
         _ExtentX        =   8811
         _ExtentY        =   2566
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
         NumItems        =   6
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Numero"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Saldo"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "PtoVta"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "TipoComp"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Comprobante"
            Object.Width           =   2540
         EndProperty
      End
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H80000008&
      Caption         =   "Efectivo"
      ForeColor       =   &H000080FF&
      Height          =   975
      Left            =   360
      TabIndex        =   8
      Top             =   1920
      Width           =   8655
      Begin VB.TextBox Text2 
         Alignment       =   2  'Center
         Height          =   285
         Left            =   3720
         TabIndex        =   10
         Text            =   "Text2"
         Top             =   360
         Width           =   1455
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Efectivo:"
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
         Left            =   2280
         TabIndex        =   9
         Top             =   360
         Width           =   1455
      End
   End
   Begin VB.Frame Frame6 
      BackColor       =   &H80000007&
      Caption         =   "Otros Conceptos"
      ForeColor       =   &H000080FF&
      Height          =   2895
      Left            =   360
      TabIndex        =   30
      Top             =   3240
      Width           =   8655
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   15
         Left            =   6120
         TabIndex        =   50
         Text            =   "Text6"
         Top             =   2520
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   14
         Left            =   6120
         TabIndex        =   48
         Text            =   "Text6"
         Top             =   2160
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   13
         Left            =   2160
         TabIndex        =   47
         Text            =   "Text6"
         Top             =   2160
         Width           =   3855
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   12
         Left            =   840
         TabIndex        =   46
         Text            =   "Text6"
         Top             =   2160
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   11
         Left            =   6120
         TabIndex        =   45
         Text            =   "Text6"
         Top             =   1800
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   10
         Left            =   2160
         TabIndex        =   44
         Text            =   "Text6"
         Top             =   1800
         Width           =   3855
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   9
         Left            =   840
         TabIndex        =   43
         Text            =   "Text6"
         Top             =   1800
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   8
         Left            =   6120
         TabIndex        =   42
         Text            =   "Text6"
         Top             =   1440
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   7
         Left            =   2160
         TabIndex        =   41
         Text            =   "Text6"
         Top             =   1440
         Width           =   3855
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   6
         Left            =   840
         TabIndex        =   40
         Text            =   "Text6"
         Top             =   1440
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   5
         Left            =   6120
         TabIndex        =   39
         Text            =   "Text6"
         Top             =   1080
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   4
         Left            =   2160
         TabIndex        =   38
         Text            =   "Text6"
         Top             =   1080
         Width           =   3855
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   3
         Left            =   840
         TabIndex        =   37
         Text            =   "Text6"
         Top             =   1080
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   2
         Left            =   6120
         TabIndex        =   36
         Text            =   "Text6"
         Top             =   720
         Width           =   1215
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   1
         Left            =   2160
         TabIndex        =   35
         Text            =   "Text6"
         Top             =   720
         Width           =   3855
      End
      Begin VB.TextBox Text6 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   0
         Left            =   840
         TabIndex        =   34
         Text            =   "Text6"
         Top             =   720
         Width           =   1215
      End
      Begin VB.Label Label15 
         Alignment       =   2  'Center
         Caption         =   "Total Otros Conceptos"
         Height          =   255
         Left            =   2160
         TabIndex        =   49
         Top             =   2520
         Width           =   3855
      End
      Begin VB.Label Label14 
         Alignment       =   2  'Center
         Caption         =   "Importe"
         Height          =   255
         Left            =   6120
         TabIndex        =   33
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label13 
         Alignment       =   2  'Center
         Caption         =   "Descripción"
         Height          =   255
         Left            =   2160
         TabIndex        =   32
         Top             =   360
         Width           =   3855
      End
      Begin VB.Label Label12 
         Alignment       =   2  'Center
         Caption         =   "Concepto"
         Height          =   255
         Index           =   0
         Left            =   840
         TabIndex        =   31
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.Frame Frame2 
      BackColor       =   &H80000007&
      Caption         =   "Cheques"
      ForeColor       =   &H000080FF&
      Height          =   3975
      Left            =   360
      TabIndex        =   11
      Top             =   2040
      Width           =   8655
      Begin MSComctlLib.ListView LCheques 
         Height          =   1695
         Left            =   360
         TabIndex        =   60
         Top             =   1320
         Width           =   8055
         _ExtentX        =   14208
         _ExtentY        =   2990
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
         NumItems        =   5
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Cod Bco"
            Object.Width           =   1411
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Descripcion"
            Object.Width           =   4410
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Nro Cheque"
            Object.Width           =   2152
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Importe"
            Object.Width           =   2143
         EndProperty
      End
      Begin MSMask.MaskEdBox FechaCh 
         Height          =   285
         Index           =   0
         Left            =   360
         TabIndex        =   25
         Top             =   840
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.TextBox Text3 
         Alignment       =   2  'Center
         BorderStyle     =   0  'None
         Height          =   285
         Index           =   4
         Left            =   6840
         TabIndex        =   18
         Text            =   "Text3"
         Top             =   3360
         Width           =   1215
      End
      Begin VB.TextBox Text3 
         Alignment       =   2  'Center
         BorderStyle     =   0  'None
         Height          =   285
         Index           =   3
         Left            =   6840
         TabIndex        =   28
         Text            =   "Text3"
         Top             =   840
         Width           =   1215
      End
      Begin VB.TextBox Text3 
         BorderStyle     =   0  'None
         Height          =   285
         Index           =   2
         Left            =   5520
         TabIndex        =   27
         Text            =   "Text3"
         Top             =   840
         Width           =   1215
      End
      Begin VB.TextBox Text3 
         BorderStyle     =   0  'None
         Height          =   285
         Index           =   1
         Left            =   2640
         TabIndex        =   16
         Text            =   "Text3"
         Top             =   840
         Width           =   2775
      End
      Begin VB.TextBox Text3 
         BorderStyle     =   0  'None
         Height          =   285
         Index           =   0
         Left            =   1680
         TabIndex        =   26
         Text            =   "Text3"
         Top             =   840
         Width           =   855
      End
      Begin VB.Label Label6 
         Alignment       =   2  'Center
         Caption         =   "Total de Cheques"
         Height          =   285
         Left            =   4200
         TabIndex        =   17
         Top             =   3360
         Width           =   2535
      End
      Begin VB.Label Label5 
         Alignment       =   2  'Center
         Caption         =   "Importe"
         Height          =   255
         Left            =   6840
         TabIndex        =   15
         Top             =   480
         Width           =   1215
      End
      Begin VB.Label Label4 
         Alignment       =   2  'Center
         Caption         =   "Nro Cheque"
         Height          =   255
         Left            =   5520
         TabIndex        =   14
         Top             =   480
         Width           =   1215
      End
      Begin VB.Label Label3 
         Alignment       =   2  'Center
         Caption         =   "Banco"
         Height          =   255
         Left            =   1680
         TabIndex        =   13
         Top             =   480
         Width           =   3735
      End
      Begin VB.Label Label2 
         Alignment       =   2  'Center
         Caption         =   "Fecha Vto"
         Height          =   255
         Left            =   360
         TabIndex        =   12
         Top             =   480
         Width           =   1215
      End
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Diferencia"
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
      Left            =   3000
      TabIndex        =   24
      Top             =   7560
      Width           =   1455
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Total Aplicado"
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
      Left            =   3000
      TabIndex        =   21
      Top             =   7080
      Width           =   1455
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Total Recibo"
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
      Left            =   3000
      TabIndex        =   19
      Top             =   6600
      Width           =   1455
   End
   Begin VB.Label Etiqueta 
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
      Index           =   0
      Left            =   6960
      TabIndex        =   7
      Top             =   480
      Width           =   1455
   End
   Begin VB.Label Etiqueta 
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
      Index           =   4
      Left            =   120
      TabIndex        =   6
      Top             =   480
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H80000005&
      BorderStyle     =   1  'Fixed Single
      Caption         =   "Label1"
      Height          =   285
      Left            =   2400
      TabIndex        =   5
      Top             =   480
      Width           =   4455
   End
End
Attribute VB_Name = "RecCob"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private TAplic As Double, TCH As Double, TEfvo As Double, Diferencia As Double, TRec As Double, TOConc As Double
Private Aplic As Double, Efvo As Double, Cheques As Double, OConc As Double, OPBUSCAR As String

Private Sub Agregar_Click()
Dim lPrimaryKey As Long
If Not FormatNumber(Diferencia) < 0 Then
    Dim Cuenta As Long
    'graba encabezado de comprobante
    Set rsEncabRec = db.OpenRecordset("EncabRec")
    Set rsChTer = db.OpenRecordset("ChequesTerc")
    Set rsRecOtros = db.OpenRecordset("RecOtros")
    Set rsAplicRec = db.OpenRecordset("AplicRec")
    Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
    rsEncabRec.Index = "Principal"
    lPrimaryKey = GetPrimaryKey
    With rsEncabRec
        .AddNew
        .Fields("NroRec") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("CodEmpresa") = Text1
        .Fields("TotalRec") = FormatNumber(Text5(0))
        .Fields("TEfvo") = FormatNumber(Text2)
        .Fields("TCheques") = FormatNumber(Text3(4))
        .Fields("TOtros") = FormatNumber(Text6(15))
        .Update
    End With
    'graba detalles de cheques
    i = 0
    Dim listch As ListItem
    For i = i + 1 To LCheques.ListItems.Count
        Set listch = LCheques.ListItems.Item(i)
        If Not listch.Tag = "" Then
                With rsChTer
                    .AddNew
                    .Fields("CodBanco") = listch.SubItems(1)
                    .Fields("NroCh") = listch.SubItems(3)
                    .Fields("FechaVto") = listch.Tag
                    .Fields("Importe") = listch.SubItems(4)
                    .Fields("Entregado") = Label1
                    .Fields("Estado") = "En Cartera"
                    .Fields("NroRec") = lPrimaryKey
                    .Fields("FRecibido") = Fecha
                    .Update
                End With
            End If
        Next
    'graba detalle de Otros Conceptos
    If Not Text6(15) = "0.00" Then
        i = 3
        For i = i To Text6.Count Step 3
            If Text6(i - 3) = "" Then
                Exit For
            Else
                With rsRecOtros
                    .AddNew
                    .Fields("NroRec") = lPrimaryKey
                    .Fields("CodConc") = Text6(i - 3)
                    .Fields("Importe") = Text6(i - 1)
                    .Update
                End With
            End If
        Next
    End If
    'graba detalle de aplicación y acualiza saldo de facturas
    If Not Text5(1) = "0.00" Then
        i = 0
        For i = i + 1 To Fact_Aplic.ListItems.Count
            Set FactAplic = Fact_Aplic.ListItems.Item(i)
                    With rsAplicRec
                        .AddNew
                        .Fields("NroRec") = lPrimaryKey
                        .Fields("PtoVta") = FactAplic.SubItems(3)
                        .Fields("NroFact") = FactAplic.SubItems(1)
                        .Fields("ImpAplic") = FactAplic.SubItems(2)
                        .Fields("CodComp") = FactAplic.SubItems(4)
                        .Update
                    End With
                    'acutaliza saldos de facturas
                    'Criterio = "CodEmp = " & Text1 & " and NroComp = " & Val(FactAplic.SubItems(1)) & " and TipoComp = " & FactAplic.SubItems(3) & ""
                    'rsCtaCteEmp.FindFirst Criterio
                    Set rsCtaCteEmp = Nothing
                    Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where CodEmp = " & Text1 & " and NroComp = " & Val(FactAplic.SubItems(1)) & " and PtoVta = " & Val(FactAplic.SubItems(3)) & " and TipoComp = " & Val(FactAplic.SubItems(4)) & "")
                    Do While Not rsCtaCteEmp.EOF
                    If rsCtaCteEmp!TipoComp = 13 Or rsCtaCteEmp!TipoComp = 1 Or rsCtaCteEmp!TipoComp = 3 Or rsCtaCteEmp!TipoComp = 16 Or rsCtaCteEmp!TipoComp = 201 Or rsCtaCteEmp!TipoComp = 203 Then
                        rsCtaCteEmp.Edit
                        rsCtaCteEmp.LockEdits = True
                        rsCtaCteEmp!SaldoComp = FormatNumber(rsCtaCteEmp!SaldoComp - FactAplic.SubItems(2))
                        rsCtaCteEmp.Update
                        rsCtaCteEmp.LockEdits = False
                        Exit Do
                    ElseIf rsCtaCteEmp!TipoComp = 6 Then
                        rsCtaCteEmp.Edit
                        rsCtaCteEmp.LockEdits = True
                        rsCtaCteEmp!SaldoComp = FormatNumber(rsCtaCteEmp!SaldoComp + FactAplic.SubItems(2))
                        rsCtaCteEmp.Update
                        rsCtaCteEmp.LockEdits = False
                        Exit Do
                    Else
                        rsCtaCteEmp.MoveNext
                    End If
                    Loop
        Next
        If FormatNumber(Diferencia) > 0 Then
            With rsAplicRec
                .AddNew
                .Fields("NroRec") = lPrimaryKey
                .Fields("ImpAplic") = FormatNumber(Diferencia)
                .Fields("ACta") = "SI"
                .Update
            End With
        End If
    End If
    'graba recibo en cta cte
    With rsCtaCteEmp
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodEmp") = Text1
        .Fields("PtoVta") = 4
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 6
        .Fields("Haber") = FormatNumber(Text5(0))
        .Fields("SaldoComp") = FormatNumber(Diferencia)
        .Update
    End With
    Call ImprimeRec(lPrimaryKey)
    List_FactPend.ListItems.Clear
    Fact_Aplic.ListItems.Clear
    Set rsEncabRec = Nothing
    Set rsChTer = Nothing
    Set rsRecOtros = Nothing
    Set rsAplicRec = Nothing
    Set rsCtaCteEmp = Nothing
    Form_Load
Else
    MsgBox "La aplicación de Facturas no puede suepera al Total del Recibo", vbInformation
End If
End Sub
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabRec
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroRec") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function

Private Sub AplicaRec_Click()
Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where CodEmp = 1 and TipoComp = 6")
Do While Not rsCtaCteEmp.EOF
    Set rsAplicRec = db.OpenRecordset("Select * from Aplicrec Where NroRec = " & rsCtaCteEmp!NroComp & "")
    Do While Not rsAplicRec.EOF
        If Not rsAplicRec!NroFact = "" Then
            Set rsCtaCteProv = db.OpenRecordset("Select * From CtaCteEmp Where NroComp = " & rsAplicRec!NroFact & "")
            Do While Not rsCtaCteProv.EOF
            If rsCtaCteProv!TipoComp = 16 Then
            If Not rsCtaCteProv!SaldoComp = 0 Then
                rsCtaCteProv.Edit
                rsCtaCteProv!SaldoComp = rsCtaCteProv!SaldoComp - rsAplicRec!impaplic
                rsCtaCteProv.Update
            End If
            End If
            rsCtaCteProv.MoveNext
            Loop
        End If
        rsAplicRec.MoveNext
    Loop
    rsCtaCteEmp.MoveNext
Loop

End Sub

Private Sub AplicarFact_Click()
Frame1.Visible = False: Frame2.Visible = False: Frame3.Visible = True: Frame6.Visible = False
End Sub

Private Sub Command1_Click()
If Val(Text4(3)) = Val(Text4(2)) Then
    TAplic = TAplic - Aplic + Text4(3)
    Diferencia = TRec - TAplic
    Text5(1) = FormatNumber(TAplic)
    Text5(2) = FormatNumber(Diferencia)
    Set FactAplic = Fact_Aplic.ListItems.Add(, , Text4(0))
    FactAplic.Tag = Text4(0)
    FactAplic.SubItems(1) = Text4(1)
    FactAplic.SubItems(2) = FormatNumber(Text4(3))
    FactAplic.SubItems(3) = Text4(4)
    FactAplic.SubItems(4) = Text4(5)
    Text4(0) = "": Text4(1) = "": Text4(2) = "": Text4(3) = "0.00"
ElseIf Val(Text4(3)) < Val(Text4(2)) Then
    Set FactPend = List_FactPend.ListItems.Add(, , Text4(0))
    FactPend.Tag = Text4(0)
    FactPend.SubItems(1) = Text4(1)
    FactPend.SubItems(2) = FormatNumber(Text4(2) - Text4(3))
    TAplic = TAplic - Aplic + Text4(3)
    Diferencia = TRec - TAplic
    Text5(1) = FormatNumber(TAplic)
    Text5(2) = FormatNumber(Diferencia)
    Set FactAplic = Fact_Aplic.ListItems.Add(, , Text4(0))
    FactAplic.Tag = Text4(0)
    FactAplic.SubItems(1) = Text4(1)
    FactAplic.SubItems(2) = FormatNumber(Text4(3))
    FactAplic.SubItems(3) = Text4(4)
    FactAplic.SubItems(4) = Text4(5)
    Text4(0) = "": Text4(1) = "": Text4(2) = "": Text4(3) = "0.00"
Else
    MsgBox "El importe aplicado no puede ser mayor al saldo de al factura", vbInformation
End If
End Sub

Private Sub Command2_Click()
            
End Sub

Private Sub Efectivo_Click()
Frame1.Visible = True: Frame2.Visible = False: Frame3.Visible = False: Frame6.Visible = False
i = Len(Text2)
Text2.SelStart = 0
Text2.SelLength = i
Text2.SetFocus
End Sub

Private Sub Fact_Aplic_DblClick()
Dim ret As VbMsgBoxResult
ret = MsgBoxExText(" Que desea modificar ? ", vbYesNo + vbQuestion, _
                       "Corregir", NO, " Eliminar")

If ret = vbYes Then
    Set FactAplic = Fact_Aplic.ListItems.Item(Fact_Aplic.SelectedItem.Index)
    retorno = InputBox("Ingrese el importe", "Modificar")
    TAplic = TAplic - FactAplic.SubItems(2)
    Diferencia = TRec - TAplic
    FactAplic.SubItems(2) = FormatNumber(retorno)
    TAplic = TAplic + retorno
    Diferencia = TRec - TAplic
    Text5(1) = FormatNumber(TAplic)
    Text5(2) = FormatNumber(Diferencia)
Else
    Set FactAplic = Fact_Aplic.ListItems.Item(Fact_Aplic.SelectedItem.Index)
    TAplic = TAplic - FactAplic.SubItems(2)
    Diferencia = TRec - TAplic
    Fact_Aplic.ListItems.Remove (Fact_Aplic.SelectedItem.Index)
    Text5(1) = FormatNumber(TAplic)
    Text5(2) = FormatNumber(Diferencia)
End If

End Sub

Private Sub Fecha_LostFocus()
If Not IsDate(Fecha) Or Fecha = "__/__/____" Then
    MsgBox "Campo Obligatorio", vbInformation
    Fecha.SetFocus
End If
End Sub

Private Sub FechaCh_GotFocus(Index As Integer)
FechaCh(Index).Mask = "##/##/####"
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
    Case vbKeyF3: Call Buscar
    End Select
End Sub
Private Sub Buscar()
If OPBUSCAR = "EMPRESAS" Then
    With BuscEmpresas
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "RecCob"
    End With
End If
End Sub
Private Sub Form_Load()
Frame1.Visible = False: Frame2.Visible = False: Frame3.Visible = False: Frame6.Visible = False
TAplic = 0: TCH = 0: TEfvo = 0: Diferencia = 0: TRec = 0: TOConc = 0
Aplic = 0: Efvo = 0: Cheques = 0: OConc = 0
Label1 = ""
Fecha.Mask = "##/##/####"
i = 0
Text1 = ""
Text2 = "0.00"
For i = i + 1 To Text3.Count
    If i >= 4 Then
        Text3(i - 1) = "0.00"
    Else
        Text3(i - 1) = ""
    End If
Next
i = 0
For i = i + 1 To Text4.Count
    Text4(i - 1) = ""
Next
i = 0
For i = i + 1 To Text5.Count
    Text5(i - 1) = "0.00"
Next
i = 0
For i = i + 1 To Text6.Count
    If i = 3 Or i = 6 Or i = 9 Or i = 12 Or i = 15 Or i = 16 Then
        Text6(i - 1) = "0.00"
    Else
        Text6(i - 1) = ""
    End If
Next

End Sub

Private Sub KewlButtons1_Click()
Frame1.Visible = False: Frame2.Visible = True: Frame3.Visible = False: Frame6.Visible = False
FechaCh(0).SetFocus
End Sub

Private Sub KewlButtons2_Click()
Frame1.Visible = False: Frame2.Visible = False: Frame3.Visible = False: Frame6.Visible = True

End Sub

Private Sub ListView1_BeforeLabelEdit(Cancel As Integer)

End Sub


Private Sub LCheques_DblClick()
   
        Dim ListaCH As ListItem
        Set ListaCH = LCheques.ListItems.Item(LCheques.SelectedItem.Index)
        FechaCh(0) = ListaCH.Tag
         Text3(0) = ListaCH.SubItems(1)
         Text3(1) = ListaCH.SubItems(2)
         Text3(2) = ListaCH.SubItems(3)
         Text3(3) = ListaCH.SubItems(4)
         TCH = TCH - ListaCH.SubItems(4)
         TRec = TRec - ListaCH.SubItems(4)
        Diferencia = TRec + TAplic
         Text5(0) = FormatNumber(TRec)
        Text5(2) = FormatNumber(Diferencia)
        Text3(4) = FormatNumber(TCH)
        LCheques.ListItems.Remove (LCheques.SelectedItem.Index)
        FechaCh(0).SetFocus
End Sub

Private Sub List_FactPend_DblClick()
Set FactPend = List_FactPend.ListItems.Item(List_FactPend.SelectedItem.Index)
Text4(0) = FactPend.Tag
Text4(1) = FactPend.SubItems(1)
Text4(2) = FactPend.SubItems(2)
Text4(4) = FactPend.SubItems(3)
Text4(5) = FactPend.SubItems(4)
Text4(3) = FactPend.SubItems(2)
Text4(3).SetFocus
Tamaño = Len(Text4(3))
Text4(3).SelStart = 0
Text4(3).SelLength = Tamaño
List_FactPend.ListItems.Remove (List_FactPend.SelectedItem.Index)
End Sub

Private Sub Text1_GotFocus()
OPBUSCAR = "EMPRESAS"
End Sub

Private Sub Text1_LostFocus()
If Not Text1 = "" Then
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & Text1 & "")
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        Label1 = rsEmpresas!DescEmpresas
    End If
    Set rsEmpresas = Nothing
    'busca facturas con saldo
    List_FactPend.ListItems.Clear
    Set rsCtaCteEmp = db.OpenRecordset("Select * From CtaCteEmp Where CodEmp = " & Text1 & " and SaldoComp > 0 Order By Fecha")
    x = 0
    i = 0
    For i = i + 1 To Text4.Count
        Text4(i - 1) = ""
    Next
    Do While Not rsCtaCteEmp.EOF
        If x < 216 Then
        Tamaño = Len(rsCtaCteEmp!PtoVta)
        Select Case Tamaño
            Case 1: VPtoVta = "000" & rsCtaCteEmp!PtoVta
            Case 2: VPtoVta = "00" & rsCtaCteEmp!PtoVta
            Case 3: VPtoVta = "0" & rsCtaCteEmp!PtoVta
            Case 4: VPtoVta = rsCtaCteEmp!PtoVta
        End Select
        Text4(1 + x) = VPtoVta
        Tamaño = Len(rsCtaCteEmp!NroComp)
        Select Case Tamaño
            Case 1: VNro = "0000000" & rsCtaCteEmp!NroComp
            Case 2: VNro = "000000" & rsCtaCteEmp!NroComp
            Case 3: VNro = "00000" & rsCtaCteEmp!NroComp
            Case 4: VNro = "0000" & rsCtaCteEmp!NroComp
            Case 5: VNro = "000" & rsCtaCteEmp!NroComp
            Case 6: VNro = "00" & rsCtaCteEmp!NroComp
            Case 7: VNro = "0" & rsCtaCteEmp!NroComp
            Case 8: VNro = rsCtaCteEmp!NroComp
        End Select
        If Not rsCtaCteEmp!TipoComp = 6 Then
            Set FactPend = List_FactPend.ListItems.Add(, , rsCtaCteEmp!Fecha)
            FactPend.Tag = rsCtaCteEmp!Fecha
            FactPend.SubItems(1) = VNro
            FactPend.SubItems(2) = rsCtaCteEmp!SaldoComp
            FactPend.SubItems(3) = rsCtaCteEmp!PtoVta
            FactPend.SubItems(4) = rsCtaCteEmp!TipoComp
            
        Else
            List_FactPend.ForeColor = &HFF&
            Set FactPend = List_FactPend.ListItems.Add(, , rsCtaCteEmp!Fecha)
            FactPend.Tag = rsCtaCteEmp!Fecha
            FactPend.SubItems(1) = VNro
            FactPend.SubItems(2) = rsCtaCteEmp!SaldoComp * -1
            FactPend.SubItems(3) = rsCtaCteEmp!PtoVta
            FactPend.SubItems(4) = rsCtaCteEmp!TipoComp
            List_FactPend.ForeColor = &H0&
            
        End If
                       
        End If
        rsCtaCteEmp.MoveNext
    Loop
    Set rsCtaCteEmp = Nothing
Else
    
End If
End Sub

Private Sub Text2_GotFocus()
Efvo = Text2

End Sub

Private Sub Text2_LostFocus()
Text2 = FormatNumber(Text2)
TEfvo = TEfvo - Efvo + Text2
TRec = TRec - Efvo + Text2
Text5(0) = FormatNumber(TRec)
Diferencia = TRec - TAplic
Text5(2) = FormatNumber(Diferencia)
End Sub

Private Sub Text3_GotFocus(Index As Integer)
Select Case Index
    Case 3:
        'Cheques = Text3(3).
        Tamaño = Len(Text3(3))
        Text3(3).SelStart = 0
        Text3(3).SelLength = Tamaño
End Select
End Sub

Private Sub Text3_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & Text3(Index) & "")
        If Not rsBcos.EOF And Not rsBcos.BOF Then
            Text3(Index + 1) = rsBcos!DescBco
        End If
        Set rsBcos = Nothing
    Case 3:
        TCH = TCH - Cheques + Text3(Index)
        TRec = TRec - Cheques + Text3(Index)
        Diferencia = TRec - TAplic
        Text5(0) = FormatNumber(TRec)
        Text5(2) = FormatNumber(Diferencia)
        Text3(4) = FormatNumber(TCH)
        Text3(Index) = FormatNumber(Text3(Index))
        Dim ListaCH As ListItem
        Set ListaCH = LCheques.ListItems.Add(, , FechaCh(0))
        ListaCH.Tag = FechaCh(0)
        ListaCH.SubItems(1) = Text3(0)
        ListaCH.SubItems(2) = Text3(1)
        ListaCH.SubItems(3) = Text3(2)
        ListaCH.SubItems(4) = Text3(3)
        FechaCh(0).Mask = ""
        FechaCh(0).Text = ""
        FechaCh(0).Mask = "##/##/####"
        Text3(0) = "": Text3(1) = "": Text3(2) = "": Text3(3) = ""
        FechaCh(0).SetFocus
End Select
End Sub

Private Sub Text4_GotFocus(Index As Integer)
'Select Case Index
 '   Case 5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 95, 101, 107, 113, 119, 125, 131, 137, 143, 149, 155, 161, 167, 173, 179, 185, 191, 197, 203, 209, 215:
  '      Tamaño = Len(Text4(Index))
   '     Text4(Index).SelStart = 0
    '    Text4(Index).SelLength = Tamaño
     '   Aplic = Text4(Index)
      '  Text4(Index).SetFocus
'End Select
End Sub

Private Sub Text4_LostFocus(Index As Integer)
'Select Case Index
'    Case 5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 95, 101, 107, 113, 119, 125, 131, 137, 143, 149, 155, 161, 167, 173, 179, 185, 191, 197, 203, 209, 215:
 '       Text4(Index) = FormatNumber(Text4(Index))
  '      TAplic = TAplic - Aplic + Text4(Index)
   '     Diferencia = TRec - TAplic
    '    Text5(1) = FormatNumber(TAplic)
     '   Text5(2) = FormatNumber(Diferencia)
'End Select
End Sub

Private Sub Text6_GotFocus(Index As Integer)
Select Case Index
    Case 2, 5, 8, 11, 14:
        Tamaño = Len(Text6(Index))
        Text6(Index).SelStart = 0
        Text6(Index).SelLength = Tamaño
        OConc = Text6(Index)
End Select
End Sub

Private Sub Text6_LostFocus(Index As Integer)
Select Case Index
    Case 0, 3, 6, 9, 12:
        If Not Text6(Index) = "" Then
        Set rsConcRec = db.OpenRecordset("Select * From ConceptoRec Where CodConcepto = " & Text6(Index) & "")
        If Not rsConcRec.EOF And Not rsConcRec.BOF Then
            Text6(Index + 1) = rsConcRec!descconcepto
        Else
            MsgBox "Concepto no Existe", vbInformation
            Text6(Index + 1) = ""
            Text6(Index).SetFocus
        End If
        Set rsConcRec = Nothing
        End If
    Case 2, 5, 8, 11, 14:
        TOConc = TOConc - OConc + Text6(Index)
        TRec = TRec - OConc + Text6(Index)
        Diferencia = TRec - TAplic
        Text5(0) = FormatNumber(TRec)
        Text5(2) = FormatNumber(Diferencia)
        Text6(15) = FormatNumber(TOConc)
        Text6(Index) = FormatNumber(Text6(Index))
End Select
        
    
End Sub

Private Sub VScroll1_Change()
Frame5.Top = 0 - VScroll1.Value
End Sub
