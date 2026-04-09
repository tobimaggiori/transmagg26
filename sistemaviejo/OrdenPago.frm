VERSION 5.00
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Begin VB.Form OrdenPago 
   BackColor       =   &H80000007&
   Caption         =   "Orden de Pago"
   ClientHeight    =   10125
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   11415
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   10125
   ScaleWidth      =   11415
   Begin VB.TextBox Text1 
      Height          =   285
      HideSelection   =   0   'False
      Index           =   48
      Left            =   6480
      TabIndex        =   255
      Text            =   "Text1"
      Top             =   9360
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Height          =   285
      HideSelection   =   0   'False
      Index           =   47
      Left            =   6480
      TabIndex        =   254
      Text            =   "Text1"
      Top             =   9000
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Height          =   285
      HideSelection   =   0   'False
      Index           =   46
      Left            =   6480
      TabIndex        =   253
      Text            =   "Text1"
      Top             =   8640
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   2280
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   480
      Width           =   5175
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   285
      Left            =   1200
      TabIndex        =   0
      Top             =   120
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   1200
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   480
      Width           =   975
   End
   Begin VB.TextBox Text1 
      BackColor       =   &H0080C0FF&
      Height          =   285
      Index           =   0
      Left            =   5040
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   120
      Width           =   855
   End
   Begin KewlButtonz.KewlButtons Efectivo 
      Height          =   615
      Left            =   120
      TabIndex        =   4
      Top             =   1080
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Efectivo y Desc"
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
      MICON           =   "OrdenPago.frx":0000
      PICN            =   "OrdenPago.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons CHProp 
      Height          =   615
      Left            =   1560
      TabIndex        =   5
      Top             =   1080
      Width           =   1455
      _ExtentX        =   2566
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Cheques Propios"
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
      MICON           =   "OrdenPago.frx":0336
      PICN            =   "OrdenPago.frx":0352
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
      Height          =   615
      Left            =   6240
      TabIndex        =   7
      Top             =   1080
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   1085
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
      MICON           =   "OrdenPago.frx":066C
      PICN            =   "OrdenPago.frx":0688
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
      Height          =   615
      Left            =   7680
      TabIndex        =   8
      Top             =   1080
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   1085
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
      MICON           =   "OrdenPago.frx":270A
      PICN            =   "OrdenPago.frx":2726
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
      Left            =   4800
      TabIndex        =   21
      Top             =   1080
      Width           =   1335
      _ExtentX        =   2355
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
      MICON           =   "OrdenPago.frx":2CC0
      PICN            =   "OrdenPago.frx":2CDC
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons CHTerc 
      Height          =   615
      Left            =   3120
      TabIndex        =   6
      Top             =   1080
      Width           =   1575
      _ExtentX        =   2778
      _ExtentY        =   1085
      BTYPE           =   1
      TX              =   "Cheques Terceros"
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
      MICON           =   "OrdenPago.frx":2FF6
      PICN            =   "OrdenPago.frx":3012
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Frame ChequesPropios 
      BackColor       =   &H80000007&
      Caption         =   "Cheques Propios "
      ForeColor       =   &H0080C0FF&
      Height          =   6735
      Left            =   720
      TabIndex        =   13
      Top             =   1800
      Width           =   7455
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   0
         Left            =   1680
         TabIndex        =   279
         Text            =   "Text2"
         Top             =   480
         Width           =   1335
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   1
         Left            =   1680
         TabIndex        =   278
         Text            =   "Text2"
         Top             =   840
         Width           =   1815
      End
      Begin VB.TextBox Text2 
         Height          =   285
         Index           =   2
         Left            =   1680
         TabIndex        =   276
         Text            =   "Text2"
         Top             =   1200
         Width           =   1455
      End
      Begin VB.Frame Adelantados 
         BackColor       =   &H80000007&
         Caption         =   "CH Adelantados"
         ForeColor       =   &H0080C0FF&
         Height          =   1815
         Left            =   240
         TabIndex        =   273
         Top             =   1560
         Width           =   6735
         Begin MSComctlLib.ListView CHPAdel 
            Height          =   1455
            Left            =   120
            TabIndex        =   274
            Top             =   240
            Width           =   6495
            _ExtentX        =   11456
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
            NumItems        =   5
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "CtaCte"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   2822
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Nro"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Vto"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   4
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   44
         Left            =   6000
         TabIndex        =   14
         Text            =   "Text1"
         Top             =   6360
         Width           =   1215
      End
      Begin MSComctlLib.ListView ListCHP 
         Height          =   1455
         Left            =   360
         TabIndex        =   275
         Top             =   3480
         Width           =   6495
         _ExtentX        =   11456
         _ExtentY        =   2566
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
            Text            =   "CtaCte"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Banco"
            Object.Width           =   2822
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Nro"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Vto"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Importe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Adel"
            Object.Width           =   353
         EndProperty
      End
      Begin MSMask.MaskEdBox VtoCHPropio 
         Height          =   285
         Left            =   5400
         TabIndex        =   277
         Top             =   840
         Width           =   1455
         _ExtentX        =   2566
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin KewlButtonz.KewlButtons AgregarCHP 
         Height          =   375
         Left            =   3480
         TabIndex        =   280
         Top             =   1200
         Width           =   2415
         _ExtentX        =   4260
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
         MICON           =   "OrdenPago.frx":332C
         PICN            =   "OrdenPago.frx":3348
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Cta Corriente:"
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
         Left            =   360
         TabIndex        =   288
         Top             =   480
         Width           =   1455
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Bco:"
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
         Index           =   18
         Left            =   3120
         TabIndex        =   287
         Top             =   480
         Width           =   615
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   0
         Left            =   3720
         TabIndex        =   286
         Top             =   480
         Width           =   3135
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Nro Cheque:"
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
         Index           =   19
         Left            =   360
         TabIndex        =   285
         Top             =   840
         Width           =   1455
      End
      Begin VB.Label Etiqueta 
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
         Index           =   20
         Left            =   3840
         TabIndex        =   284
         Top             =   840
         Width           =   1455
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Importe"
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
         Index           =   21
         Left            =   360
         TabIndex        =   283
         Top             =   1200
         Width           =   1455
      End
      Begin VB.Label Label2 
         BorderStyle     =   1  'Fixed Single
         Caption         =   "Label2"
         Height          =   255
         Index           =   1
         Left            =   4800
         TabIndex        =   282
         Top             =   5160
         Width           =   1500
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Cheques Propios"
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
         Index           =   22
         Left            =   360
         TabIndex        =   281
         Top             =   5160
         Width           =   4095
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Cheques Propios"
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
         Left            =   3480
         TabIndex        =   17
         Top             =   6360
         Width           =   2415
      End
   End
   Begin VB.Frame FEfvo 
      BackColor       =   &H80000007&
      Caption         =   "Efectivo"
      ForeColor       =   &H0080C0FF&
      Height          =   5415
      Left            =   120
      TabIndex        =   10
      Top             =   1800
      Width           =   9735
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   3
         Left            =   1320
         TabIndex        =   11
         Text            =   "Text1"
         Top             =   360
         Width           =   1575
      End
      Begin VB.Frame Descuentos 
         BackColor       =   &H00000000&
         Caption         =   "Descuentos"
         ForeColor       =   &H000040C0&
         Height          =   4215
         Left            =   120
         TabIndex        =   256
         Top             =   840
         Width           =   9495
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   53
            Left            =   3600
            TabIndex        =   272
            Text            =   "Text1"
            Top             =   3720
            Width           =   1455
         End
         Begin VB.TextBox Text1 
            Height          =   285
            Index           =   52
            Left            =   1200
            TabIndex        =   262
            Text            =   "Text1"
            Top             =   360
            Width           =   1455
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   51
            Left            =   1800
            TabIndex        =   261
            Text            =   "Text1"
            Top             =   840
            Width           =   1455
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   50
            Left            =   1800
            TabIndex        =   260
            Text            =   "Text1"
            Top             =   1200
            Width           =   1455
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   49
            Left            =   1800
            TabIndex        =   259
            Text            =   "Text1"
            Top             =   1560
            Width           =   1455
         End
         Begin MSComctlLib.ListView DescPendientes 
            Height          =   1335
            Left            =   3600
            TabIndex        =   257
            Top             =   480
            Width           =   4275
            _ExtentX        =   7541
            _ExtentY        =   2355
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
            NumItems        =   4
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "Fecha"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "PtoVta"
               Object.Width           =   529
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Numero"
               Object.Width           =   1411
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
         Begin MSComctlLib.ListView ListDescuentos 
            Height          =   1575
            Left            =   120
            TabIndex        =   258
            Top             =   2040
            Width           =   8775
            _ExtentX        =   15478
            _ExtentY        =   2778
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
               Text            =   "Nro Remito"
               Object.Width           =   3792
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Adelanto Efvo"
               Object.Width           =   3792
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Adelantos de Gas-Oil"
               Object.Width           =   3792
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Faltantes"
               Object.Width           =   3792
            EndProperty
         End
         Begin KewlButtonz.KewlButtons AgregarDesc 
            Height          =   375
            Left            =   7920
            TabIndex        =   263
            Top             =   480
            Width           =   1335
            _ExtentX        =   2355
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
            MICON           =   "OrdenPago.frx":53CA
            PICN            =   "OrdenPago.frx":53E6
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
            Height          =   375
            Left            =   7920
            TabIndex        =   264
            Top             =   840
            Width           =   1335
            _ExtentX        =   2355
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
            MICON           =   "OrdenPago.frx":7468
            PICN            =   "OrdenPago.frx":7484
            UMCOL           =   -1  'True
            SOFT            =   0   'False
            PICPOS          =   0
            NGREY           =   0   'False
            FX              =   1
            HAND            =   0   'False
            CHECK           =   0   'False
            VALUE           =   0   'False
         End
         Begin KewlButtonz.KewlButtons VolverDesc 
            Height          =   375
            Left            =   9480
            TabIndex        =   270
            Top             =   2760
            Width           =   2295
            _ExtentX        =   4048
            _ExtentY        =   661
            BTYPE           =   1
            TX              =   "Volver a Resumen"
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
            MICON           =   "OrdenPago.frx":7A1E
            PICN            =   "OrdenPago.frx":7A3A
            UMCOL           =   -1  'True
            SOFT            =   0   'False
            PICPOS          =   0
            NGREY           =   0   'False
            FX              =   1
            HAND            =   0   'False
            CHECK           =   0   'False
            VALUE           =   0   'False
         End
         Begin VB.Label Label27 
            BackColor       =   &H00000000&
            Caption         =   "Total Descuentos"
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
            Left            =   1320
            TabIndex        =   271
            Top             =   3720
            Width           =   1815
         End
         Begin VB.Label Label24 
            BackColor       =   &H00000000&
            Caption         =   "Remito Nro"
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
            Left            =   120
            TabIndex        =   269
            Top             =   360
            Width           =   1215
         End
         Begin VB.Label Label25 
            BackColor       =   &H00000000&
            Caption         =   "Adelanto Efvo"
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
            Left            =   120
            TabIndex        =   268
            Top             =   840
            Width           =   1455
         End
         Begin VB.Label Label26 
            BackColor       =   &H00000000&
            Caption         =   "Adelantos Gas-Oil"
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
            Left            =   120
            TabIndex        =   267
            Top             =   1200
            Width           =   1575
         End
         Begin VB.Label Label27 
            BackColor       =   &H00000000&
            Caption         =   "Faltantes"
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
            Left            =   120
            TabIndex        =   266
            Top             =   1560
            Width           =   1215
         End
         Begin VB.Label Label24 
            Alignment       =   2  'Center
            BackColor       =   &H00000000&
            Caption         =   "Adelantos Pendientes"
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
            Left            =   3600
            TabIndex        =   265
            Top             =   240
            Width           =   4215
         End
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Efctivo"
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
         Left            =   360
         TabIndex        =   12
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.Frame FactPendientes 
      BackColor       =   &H00000000&
      Caption         =   "Aplicar Facturas"
      ForeColor       =   &H0080C0FF&
      Height          =   6720
      Left            =   0
      TabIndex        =   25
      Top             =   1800
      Width           =   9735
      Begin VB.Frame Frame4 
         BackColor       =   &H80000007&
         BorderStyle     =   0  'None
         Caption         =   "Frame4"
         Height          =   13215
         Left            =   360
         TabIndex        =   27
         Top             =   600
         Width           =   7935
         Begin VB.Frame Frame5 
            BackColor       =   &H80000008&
            BorderStyle     =   0  'None
            Caption         =   "Frame4"
            Height          =   13215
            Left            =   -240
            TabIndex        =   28
            Top             =   120
            Width           =   7935
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   4
               Left            =   5160
               TabIndex        =   244
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   3
               Left            =   3840
               TabIndex        =   243
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   2
               Left            =   2280
               TabIndex        =   242
               Text            =   "Text4"
               Top             =   240
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   1
               Left            =   1560
               TabIndex        =   241
               Text            =   "Text4"
               Top             =   240
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   0
               Left            =   240
               TabIndex        =   240
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   5
               Left            =   6480
               TabIndex        =   239
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   6
               Left            =   240
               TabIndex        =   238
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   7
               Left            =   1560
               TabIndex        =   237
               Text            =   "Text4"
               Top             =   600
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   8
               Left            =   2280
               TabIndex        =   236
               Text            =   "Text4"
               Top             =   600
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   9
               Left            =   3840
               TabIndex        =   235
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   10
               Left            =   5160
               TabIndex        =   234
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   11
               Left            =   6480
               TabIndex        =   233
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   12
               Left            =   240
               TabIndex        =   232
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   13
               Left            =   1560
               TabIndex        =   231
               Text            =   "Text4"
               Top             =   960
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   14
               Left            =   2280
               TabIndex        =   230
               Text            =   "Text4"
               Top             =   960
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   15
               Left            =   3840
               TabIndex        =   229
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   16
               Left            =   5160
               TabIndex        =   228
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   17
               Left            =   6480
               TabIndex        =   227
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   18
               Left            =   240
               TabIndex        =   226
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   19
               Left            =   1560
               TabIndex        =   225
               Text            =   "Text4"
               Top             =   1320
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   20
               Left            =   2280
               TabIndex        =   224
               Text            =   "Text4"
               Top             =   1320
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   21
               Left            =   3840
               TabIndex        =   223
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   22
               Left            =   5160
               TabIndex        =   222
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   23
               Left            =   6480
               TabIndex        =   221
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   24
               Left            =   240
               TabIndex        =   220
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   25
               Left            =   1560
               TabIndex        =   219
               Text            =   "Text4"
               Top             =   1680
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   26
               Left            =   2280
               TabIndex        =   218
               Text            =   "Text4"
               Top             =   1680
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   27
               Left            =   3840
               TabIndex        =   217
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   28
               Left            =   5160
               TabIndex        =   216
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   29
               Left            =   6480
               TabIndex        =   215
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   30
               Left            =   240
               TabIndex        =   214
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   31
               Left            =   1560
               TabIndex        =   213
               Text            =   "Text4"
               Top             =   2040
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   32
               Left            =   2280
               TabIndex        =   212
               Text            =   "Text4"
               Top             =   2040
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   33
               Left            =   3840
               TabIndex        =   211
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   34
               Left            =   5160
               TabIndex        =   210
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   35
               Left            =   6480
               TabIndex        =   209
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   36
               Left            =   240
               TabIndex        =   208
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   37
               Left            =   1560
               TabIndex        =   207
               Text            =   "Text4"
               Top             =   2400
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   38
               Left            =   2280
               TabIndex        =   206
               Text            =   "Text4"
               Top             =   2400
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   39
               Left            =   3840
               TabIndex        =   205
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   40
               Left            =   5160
               TabIndex        =   204
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   41
               Left            =   6480
               TabIndex        =   203
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   42
               Left            =   240
               TabIndex        =   202
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   43
               Left            =   1560
               TabIndex        =   201
               Text            =   "Text4"
               Top             =   2760
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   44
               Left            =   2280
               TabIndex        =   200
               Text            =   "Text4"
               Top             =   2760
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   45
               Left            =   3840
               TabIndex        =   199
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   46
               Left            =   5160
               TabIndex        =   198
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   47
               Left            =   6480
               TabIndex        =   197
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   48
               Left            =   240
               TabIndex        =   196
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   49
               Left            =   1560
               TabIndex        =   195
               Text            =   "Text4"
               Top             =   3120
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   50
               Left            =   2280
               TabIndex        =   194
               Text            =   "Text4"
               Top             =   3120
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   51
               Left            =   3840
               TabIndex        =   193
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   52
               Left            =   5160
               TabIndex        =   192
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   53
               Left            =   6480
               TabIndex        =   191
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   54
               Left            =   240
               TabIndex        =   190
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   55
               Left            =   1560
               TabIndex        =   189
               Text            =   "Text4"
               Top             =   3480
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   56
               Left            =   2280
               TabIndex        =   188
               Text            =   "Text4"
               Top             =   3480
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   57
               Left            =   3840
               TabIndex        =   187
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   58
               Left            =   5160
               TabIndex        =   186
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   59
               Left            =   6480
               TabIndex        =   185
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   60
               Left            =   240
               TabIndex        =   184
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   61
               Left            =   1560
               TabIndex        =   183
               Text            =   "Text4"
               Top             =   3840
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   62
               Left            =   2280
               TabIndex        =   182
               Text            =   "Text4"
               Top             =   3840
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   63
               Left            =   3840
               TabIndex        =   181
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   64
               Left            =   5160
               TabIndex        =   180
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   65
               Left            =   6480
               TabIndex        =   179
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   71
               Left            =   6480
               TabIndex        =   178
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   70
               Left            =   5160
               TabIndex        =   177
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   69
               Left            =   3840
               TabIndex        =   176
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   68
               Left            =   2280
               TabIndex        =   175
               Text            =   "Text4"
               Top             =   4200
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   67
               Left            =   1560
               TabIndex        =   174
               Text            =   "Text4"
               Top             =   4200
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   66
               Left            =   240
               TabIndex        =   173
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   77
               Left            =   6480
               TabIndex        =   172
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   76
               Left            =   5160
               TabIndex        =   171
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   75
               Left            =   3840
               TabIndex        =   170
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   74
               Left            =   2280
               TabIndex        =   169
               Text            =   "Text4"
               Top             =   4560
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   73
               Left            =   1560
               TabIndex        =   168
               Text            =   "Text4"
               Top             =   4560
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   72
               Left            =   240
               TabIndex        =   167
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   83
               Left            =   6480
               TabIndex        =   166
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   82
               Left            =   5160
               TabIndex        =   165
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   81
               Left            =   3840
               TabIndex        =   164
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   80
               Left            =   2280
               TabIndex        =   163
               Text            =   "Text4"
               Top             =   4920
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   79
               Left            =   1560
               TabIndex        =   162
               Text            =   "Text4"
               Top             =   4920
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   78
               Left            =   240
               TabIndex        =   161
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   84
               Left            =   240
               TabIndex        =   160
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   85
               Left            =   1560
               TabIndex        =   159
               Text            =   "Text4"
               Top             =   5280
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   86
               Left            =   2280
               TabIndex        =   158
               Text            =   "Text4"
               Top             =   5280
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   87
               Left            =   3840
               TabIndex        =   157
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   88
               Left            =   5160
               TabIndex        =   156
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   89
               Left            =   6480
               TabIndex        =   155
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   90
               Left            =   240
               TabIndex        =   154
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   91
               Left            =   1560
               TabIndex        =   153
               Text            =   "Text4"
               Top             =   5640
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   92
               Left            =   2280
               TabIndex        =   152
               Text            =   "Text4"
               Top             =   5640
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   93
               Left            =   3840
               TabIndex        =   151
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   94
               Left            =   5160
               TabIndex        =   150
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   95
               Left            =   6480
               TabIndex        =   149
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   96
               Left            =   240
               TabIndex        =   148
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   97
               Left            =   1560
               TabIndex        =   147
               Text            =   "Text4"
               Top             =   6000
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   98
               Left            =   2280
               TabIndex        =   146
               Text            =   "Text4"
               Top             =   6000
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   99
               Left            =   3840
               TabIndex        =   145
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   100
               Left            =   5160
               TabIndex        =   144
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   101
               Left            =   6480
               TabIndex        =   143
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   102
               Left            =   240
               TabIndex        =   142
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   103
               Left            =   1560
               TabIndex        =   141
               Text            =   "Text4"
               Top             =   6360
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   104
               Left            =   2280
               TabIndex        =   140
               Text            =   "Text4"
               Top             =   6360
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   105
               Left            =   3840
               TabIndex        =   139
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   106
               Left            =   5160
               TabIndex        =   138
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   107
               Left            =   6480
               TabIndex        =   137
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   108
               Left            =   240
               TabIndex        =   136
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   109
               Left            =   1560
               TabIndex        =   135
               Text            =   "Text4"
               Top             =   6720
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   110
               Left            =   2280
               TabIndex        =   134
               Text            =   "Text4"
               Top             =   6720
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   111
               Left            =   3840
               TabIndex        =   133
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   112
               Left            =   5160
               TabIndex        =   132
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   113
               Left            =   6480
               TabIndex        =   131
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   114
               Left            =   240
               TabIndex        =   130
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   115
               Left            =   1560
               TabIndex        =   129
               Text            =   "Text4"
               Top             =   7080
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   116
               Left            =   2280
               TabIndex        =   128
               Text            =   "Text4"
               Top             =   7080
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   117
               Left            =   3840
               TabIndex        =   127
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   118
               Left            =   5160
               TabIndex        =   126
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   119
               Left            =   6480
               TabIndex        =   125
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   120
               Left            =   240
               TabIndex        =   124
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   121
               Left            =   1560
               TabIndex        =   123
               Text            =   "Text4"
               Top             =   7440
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   122
               Left            =   2280
               TabIndex        =   122
               Text            =   "Text4"
               Top             =   7440
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   123
               Left            =   3840
               TabIndex        =   121
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   124
               Left            =   5160
               TabIndex        =   120
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   125
               Left            =   6480
               TabIndex        =   119
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   126
               Left            =   240
               TabIndex        =   118
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   127
               Left            =   1560
               TabIndex        =   117
               Text            =   "Text4"
               Top             =   7800
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   128
               Left            =   2280
               TabIndex        =   116
               Text            =   "Text4"
               Top             =   7800
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   129
               Left            =   3840
               TabIndex        =   115
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   130
               Left            =   5160
               TabIndex        =   114
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   131
               Left            =   6480
               TabIndex        =   113
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   132
               Left            =   240
               TabIndex        =   112
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   133
               Left            =   1560
               TabIndex        =   111
               Text            =   "Text4"
               Top             =   8160
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   134
               Left            =   2280
               TabIndex        =   110
               Text            =   "Text4"
               Top             =   8160
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   135
               Left            =   3840
               TabIndex        =   109
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   136
               Left            =   5160
               TabIndex        =   108
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   137
               Left            =   6480
               TabIndex        =   107
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   138
               Left            =   240
               TabIndex        =   106
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   139
               Left            =   1560
               TabIndex        =   105
               Text            =   "Text4"
               Top             =   8520
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   140
               Left            =   2280
               TabIndex        =   104
               Text            =   "Text4"
               Top             =   8520
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   141
               Left            =   3840
               TabIndex        =   103
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   142
               Left            =   5160
               TabIndex        =   102
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   143
               Left            =   6480
               TabIndex        =   101
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   144
               Left            =   240
               TabIndex        =   100
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   145
               Left            =   1560
               TabIndex        =   99
               Text            =   "Text4"
               Top             =   8880
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   146
               Left            =   2280
               TabIndex        =   98
               Text            =   "Text4"
               Top             =   8880
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   147
               Left            =   3840
               TabIndex        =   97
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   148
               Left            =   5160
               TabIndex        =   96
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   149
               Left            =   6480
               TabIndex        =   95
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   150
               Left            =   240
               TabIndex        =   94
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   151
               Left            =   1560
               TabIndex        =   93
               Text            =   "Text4"
               Top             =   9240
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   152
               Left            =   2280
               TabIndex        =   92
               Text            =   "Text4"
               Top             =   9240
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   153
               Left            =   3840
               TabIndex        =   91
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   154
               Left            =   5160
               TabIndex        =   90
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   155
               Left            =   6480
               TabIndex        =   89
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   156
               Left            =   240
               TabIndex        =   88
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   157
               Left            =   1560
               TabIndex        =   87
               Text            =   "Text4"
               Top             =   9600
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   158
               Left            =   2280
               TabIndex        =   86
               Text            =   "Text4"
               Top             =   9600
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   159
               Left            =   3840
               TabIndex        =   85
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   160
               Left            =   5160
               TabIndex        =   84
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   161
               Left            =   6480
               TabIndex        =   83
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   162
               Left            =   240
               TabIndex        =   82
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   163
               Left            =   1560
               TabIndex        =   81
               Text            =   "Text4"
               Top             =   9960
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   164
               Left            =   2280
               TabIndex        =   80
               Text            =   "Text4"
               Top             =   9960
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   165
               Left            =   3840
               TabIndex        =   79
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   166
               Left            =   5160
               TabIndex        =   78
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   167
               Left            =   6480
               TabIndex        =   77
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   168
               Left            =   240
               TabIndex        =   76
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   169
               Left            =   1560
               TabIndex        =   75
               Text            =   "Text4"
               Top             =   10320
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   170
               Left            =   2280
               TabIndex        =   74
               Text            =   "Text4"
               Top             =   10320
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   171
               Left            =   3840
               TabIndex        =   73
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   172
               Left            =   5160
               TabIndex        =   72
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   173
               Left            =   6480
               TabIndex        =   71
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   174
               Left            =   240
               TabIndex        =   70
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   175
               Left            =   1560
               TabIndex        =   69
               Text            =   "Text4"
               Top             =   10680
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   176
               Left            =   2280
               TabIndex        =   68
               Text            =   "Text4"
               Top             =   10680
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   177
               Left            =   3840
               TabIndex        =   67
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   178
               Left            =   5160
               TabIndex        =   66
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   179
               Left            =   6480
               TabIndex        =   65
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   180
               Left            =   240
               TabIndex        =   64
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   181
               Left            =   1560
               TabIndex        =   63
               Text            =   "Text4"
               Top             =   11040
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   182
               Left            =   2280
               TabIndex        =   62
               Text            =   "Text4"
               Top             =   11040
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   183
               Left            =   3840
               TabIndex        =   61
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   184
               Left            =   5160
               TabIndex        =   60
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   185
               Left            =   6480
               TabIndex        =   59
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   186
               Left            =   240
               TabIndex        =   58
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   187
               Left            =   1560
               TabIndex        =   57
               Text            =   "Text4"
               Top             =   11400
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   188
               Left            =   2280
               TabIndex        =   56
               Text            =   "Text4"
               Top             =   11400
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   189
               Left            =   3840
               TabIndex        =   55
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   190
               Left            =   5160
               TabIndex        =   54
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   191
               Left            =   6480
               TabIndex        =   53
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   192
               Left            =   240
               TabIndex        =   52
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   193
               Left            =   1560
               TabIndex        =   51
               Text            =   "Text4"
               Top             =   11760
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   194
               Left            =   2280
               TabIndex        =   50
               Text            =   "Text4"
               Top             =   11760
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   195
               Left            =   3840
               TabIndex        =   49
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   196
               Left            =   5160
               TabIndex        =   48
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   197
               Left            =   6480
               TabIndex        =   47
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   198
               Left            =   240
               TabIndex        =   46
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   199
               Left            =   1560
               TabIndex        =   45
               Text            =   "Text4"
               Top             =   12120
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   200
               Left            =   2280
               TabIndex        =   44
               Text            =   "Text4"
               Top             =   12120
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   201
               Left            =   3840
               TabIndex        =   43
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   202
               Left            =   5160
               TabIndex        =   42
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   203
               Left            =   6480
               TabIndex        =   41
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   204
               Left            =   240
               TabIndex        =   40
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   205
               Left            =   1560
               TabIndex        =   39
               Text            =   "Text4"
               Top             =   12480
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   206
               Left            =   2280
               TabIndex        =   38
               Text            =   "Text4"
               Top             =   12480
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   207
               Left            =   3840
               TabIndex        =   37
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   208
               Left            =   5160
               TabIndex        =   36
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   209
               Left            =   6480
               TabIndex        =   35
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   210
               Left            =   240
               TabIndex        =   34
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   211
               Left            =   1560
               TabIndex        =   33
               Text            =   "Text4"
               Top             =   12840
               Width           =   615
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   212
               Left            =   2280
               TabIndex        =   32
               Text            =   "Text4"
               Top             =   12840
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   213
               Left            =   3840
               TabIndex        =   31
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   214
               Left            =   5160
               TabIndex        =   30
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               BackColor       =   &H0080C0FF&
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   215
               Left            =   6480
               TabIndex        =   29
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
         End
      End
      Begin VB.VScrollBar VScroll1 
         Height          =   5535
         Left            =   9000
         SmallChange     =   20
         TabIndex        =   26
         Top             =   960
         Value           =   100
         Width           =   375
      End
      Begin VB.Label Label7 
         Alignment       =   2  'Center
         Caption         =   "Fecha"
         Height          =   255
         Left            =   360
         TabIndex        =   249
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label8 
         Alignment       =   2  'Center
         Caption         =   "Número"
         Height          =   255
         Left            =   1680
         TabIndex        =   248
         Top             =   360
         Width           =   2175
      End
      Begin VB.Label Label9 
         Alignment       =   2  'Center
         Caption         =   "Importe"
         Height          =   255
         Left            =   3960
         TabIndex        =   247
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label10 
         Alignment       =   2  'Center
         Caption         =   "Saldo"
         Height          =   255
         Left            =   5280
         TabIndex        =   246
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label11 
         Alignment       =   2  'Center
         Caption         =   "Aplica"
         Height          =   255
         Left            =   6600
         TabIndex        =   245
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.Frame ChTerceros 
      BackColor       =   &H80000007&
      Caption         =   "Cheques de Terceros"
      ForeColor       =   &H0080C0FF&
      Height          =   6495
      Left            =   120
      TabIndex        =   18
      Top             =   1800
      Width           =   8655
      Begin VB.Frame Frame3 
         BackColor       =   &H80000007&
         Caption         =   "Cheques Terceros Adelantados"
         ForeColor       =   &H0080C0FF&
         Height          =   1575
         Left            =   120
         TabIndex        =   289
         Top             =   2280
         Width           =   8295
         Begin MSComctlLib.ListView LCHTAdel 
            Height          =   975
            Left            =   720
            TabIndex        =   290
            Top             =   360
            Width           =   6375
            _ExtentX        =   11245
            _ExtentY        =   1720
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
               Text            =   "Nro Ch"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   3528
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Vencimiento"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
      End
      Begin VB.Frame Frame2 
         BackColor       =   &H80000012&
         Caption         =   "Cheques Aplicados"
         ForeColor       =   &H0080C0FF&
         Height          =   2055
         Left            =   120
         TabIndex        =   24
         Top             =   3960
         Width           =   8295
         Begin MSComctlLib.ListView CHTerAplic 
            Height          =   1575
            Left            =   600
            TabIndex        =   291
            Top             =   240
            Width           =   6375
            _ExtentX        =   11245
            _ExtentY        =   2778
            View            =   3
            LabelWrap       =   0   'False
            HideSelection   =   0   'False
            FullRowSelect   =   -1  'True
            _Version        =   393217
            ForeColor       =   -2147483640
            BackColor       =   -2147483643
            BorderStyle     =   1
            Appearance      =   1
            NumItems        =   5
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "Nro Ch"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   3528
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Vencimiento"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   4
               Text            =   "Adel"
               Object.Width           =   2540
            EndProperty
         End
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   45
         Left            =   5160
         TabIndex        =   19
         Text            =   "Text1"
         Top             =   6120
         Width           =   1335
      End
      Begin VB.Frame Frame1 
         BackColor       =   &H80000012&
         Caption         =   "Cheques En Cartera"
         ForeColor       =   &H0080C0FF&
         Height          =   1935
         Left            =   120
         TabIndex        =   22
         Top             =   240
         Width           =   8295
         Begin MSComctlLib.ListView ChCartera 
            Height          =   1575
            Left            =   720
            TabIndex        =   23
            Top             =   240
            Width           =   6375
            _ExtentX        =   11245
            _ExtentY        =   2778
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
               Text            =   "Nro Ch"
               Object.Width           =   1764
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Banco"
               Object.Width           =   3528
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Vencimiento"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Importe"
               Object.Width           =   2540
            EndProperty
         End
      End
      Begin VB.Label Etiqueta 
         BackColor       =   &H00000000&
         Caption         =   "Total Cheques de Terceros"
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
         Left            =   1680
         TabIndex        =   20
         Top             =   6120
         Width           =   3255
      End
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Diferencia:"
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
      Left            =   4200
      TabIndex        =   252
      Top             =   9480
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Total Aplicado:"
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
      Left            =   4200
      TabIndex        =   251
      Top             =   9120
      Width           =   1695
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Total Pago:"
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
      Left            =   4200
      TabIndex        =   250
      Top             =   8760
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
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
      TabIndex        =   16
      Top             =   120
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Nro OP"
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
      Left            =   3720
      TabIndex        =   15
      Top             =   120
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
      BackColor       =   &H00000000&
      Caption         =   "Proveedor"
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
      Left            =   120
      TabIndex        =   9
      Top             =   480
      Width           =   1215
   End
End
Attribute VB_Name = "OrdenPago"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private TAplic As Double, TCH As Double, TEfvo As Double, Diferencia As Double, TRec As Double, TOConc As Double
Private Aplic As Double, Efvo As Double, Cheques As Double, OConc As Double, TCHTer As Double
Private VALOR As Integer
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabOP
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroOP") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function


Private Sub Aceptar_Click()
Dim lPrimaryKey As Long
If Not FormatNumber(Diferencia) < 0 Then
    Dim Cuenta As Long
    
    'graba encabezado de comprobante
    Set rsEncabOP = db.OpenRecordset("Select * From EncabOP Order By NroOP")
    Set rsChTer = db.OpenRecordset("ChequesTerc")
    Set rsAplicOP = db.OpenRecordset("AplicOP")
    Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
    Set rsDetOPCHT = db.OpenRecordset("DetOPCHT")
    Set rsDetOPCHP = db.OpenRecordset("DetOPCHPropios")
    Set rsCHEmitidos = db.OpenRecordset("ChEmitidos")
    Set rsDetOPAdel = db.OpenRecordset("DetOPAdel")
    lPrimaryKey = GetPrimaryKey
    Text1(0) = lPrimaryKey
    With rsEncabOP
        .AddNew
        .Fields("NroOP") = lPrimaryKey
        .Fields("Fecha") = Fecha
        .Fields("CodProv") = Text1(1)
        .Fields("TotalOP") = FormatNumber(Text1(46))
        .Fields("TEfvo") = FormatNumber(Text1(3))
        .Fields("TChPropio") = FormatNumber(Text1(44))
        .Fields("TCHTerceros") = FormatNumber(Text1(45))
        .Fields("TAdelantos") = FormatNumber(Text1(53))
        .Update
    End With
    Set rsEncabOP = Nothing
    'graba detalle de adelantos
    For Items = Items + 1 To ListDescuentos.ListItems.Count
        Set Lista = ListDescuentos.ListItems.Item(Items)
        With rsDetOPAdel
            .AddNew
            .Fields("NroOP") = lPrimaryKey
            .Fields("NroRemito") = Lista.Tag
            .Fields("Efvo") = Lista.SubItems(1)
            .Fields("GasOil") = Lista.SubItems(2)
            .Fields("Faltante") = Lista.SubItems(3)
            .Update
        End With
        'acutaliza estado
        Set rsGasOilFleteros = db.OpenRecordset("Select * from GasOilFleteros Where CodFlet = " & Text1(1) & " And NroFact = " & Lista.Tag & "")
        If Not rsGasOilFleteros.EOF And Not rsGasOilFleteros.BOF Then
            If rsGasOilFleteros.Fields("Importe") = Lista.SubItems(2) Then
                rsGasOilFleteros.Edit
                rsGasOilFleteros.Fields("Descontada") = "SI"
                rsGasOilFleteros.Update
            Else
                rsGasOilFleteros.Edit
                rsGasOilFleteros.Fields("Importe") = rsGasOilFleteros.Fields("Importe") - Lista.SubItems(2)
                rsGasOilFleteros.Update
                If rsGasOilFleteros.Fields("Importe") = 0 Then
                    rsGasOilFleteros.Edit
                    rsGasOilFleteros.Fields("Descontada") = "SI"
                    rsGasOilFleteros.Update
                End If
            End If
        End If
        Set rsGasOilFleteros = Nothing
    Next
    Set rsDetOPAdel = Nothing
  
    '///////////////////////////
    'graba detalles de cheques propios
    If Not Text1(44) = "0.00" Then
       i = 0
        For i = i + 1 To ListCHP.ListItems.Count
            Set Lista = ListCHP.ListItems.Item(i)
            With rsCHEmitidos
            .AddNew
            .Fields("Fecha") = Lista.SubItems(3)
            .Fields("CtaCte") = Lista.Tag
            .Fields("CodComp") = 11
            .Fields("NroComp") = Lista.SubItems(2)
            .Fields("NroMov") = lPrimaryKey
            .Fields("Haber") = Lista.SubItems(4)
            .Fields("Estado") = "Pendiente"
            .Fields("FEmision") = Fecha
            .Fields("Dado") = Text1(2)
            .Fields("Adel") = Lista.SubItems(5)
            .Update
            End With
            Set rsCtaCteBco = db.OpenRecordset("CtaCteBco")
            With rsCtaCteBco
            .AddNew
            .Fields("Fecha") = Lista.SubItems(3)
            .Fields("CtaCte") = Lista.Tag
            .Fields("CodComp") = 11
            .Fields("NroComp") = Lista.SubItems(2)
            .Fields("NroMov") = Lista.SubItems(2)
            .Fields("Haber") = Lista.SubItems(4)
            .Fields("Conciliado") = False
            .Update
            End With
            With rsDetOPCHP
            .AddNew
            .Fields("NroOP") = lPrimaryKey
            .Fields("Cuenta") = Lista.Tag
            .Fields("Importe") = Lista.SubItems(4)
            .Fields("Vto") = Lista.SubItems(3)
            .Fields("NroCH") = Lista.SubItems(2)
            .Update
            End With
            If Lista.SubItems(5) = "SI" Then
                Set rsDetAdelCHP = db.OpenRecordset("Select * From DetAdelCHP Where CodProv = " & Text1(1) & " AND NroCH = " & Lista.SubItems(2) & "")
                rsDetAdelCHP.Edit
                rsDetAdelCHP!Descontado = "SI"
                rsDetAdelCHP.Update
            End If
        Next
    End If
    Set rsDetOPCHP = Nothing
    Set rsCtaCteBco = Nothing
    'graba detalle de cheques de terceros
    If Not Text1(45) = "0.00" Then
        i = 0
        For i = i + 1 To CHTerAplic.ListItems.Count
            Set Lista = CHTerAplic.ListItems.Item(i)
            With rsDetOPCHT
               .AddNew
                .Fields("NroOP") = lPrimaryKey
                Set rsBcos = db.OpenRecordset("Select * From Bancos Where DescBco = '" & Lista.SubItems(1) & "'")
                .Fields("CodBco") = rsBcos!CodBco
           
                .Fields("Vto") = Lista.SubItems(2)
                .Fields("Importe") = Lista.SubItems(3)
                .Fields("NroCH") = Lista.Tag
                .Update
            End With
            'actualiza estado cheque tercero
            Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where CodBanco = " & rsBcos!CodBco & " and NroCH = " & Lista.Tag & " and Estado = 'En Cartera'")
            rsChTer.Edit
            rsChTer.LockEdits = True
            rsChTer.Fields("Estado") = "Orden de Pago"
            rsChTer.Fields("Dado") = Text1(2)
            rsChTer.Fields("FEntregado") = Fecha
            rsChTer.Update
            rsChTer.LockEdits = False
            If Lista.SubItems(4) = "SI" Then
                Set rsDetAdelCHT = db.OpenRecordset("Select * From DetAdelCHT Where CodProv = " & Text1(1) & " AND NroCH = " & Lista.Tag & "")
                rsDetAdelCHT.Edit
                rsDetAdelCHT!Descontado = "SI"
                rsDetAdelCHT.Update
            End If
            Set rsChTer = Nothing
            Set rsBcos = Nothing
        Next
    End If
    Set rsDetOPCHT = Nothing
    'graba detalle de aplicación y acualiza saldo de facturas
    If Not Text1(47) = "0.00" Then
        i = 6
        For i = i To Text4.Count Step 6
            If Not Text4(i - 6) = "" Then
                If Not Text4(i - 1) = "0.00" Then
                    'acutaliza saldos de facturas
                    Criterio = "CodProv = " & Text1(1) & " and NroComp = " & Text4(i - 4) & ""
                    'rsCtaCteEmp.FindFirst Criterio
                    Set rsCtaCteEmp = Nothing
                    Set rsCtaCteProv = db.OpenRecordset("Select * From CtaCteProv Where CodProv = " & Text1(1) & " and NroComp = " & Val(Text4(i - 4)) & " and PtoVta = " & Val(Text4(i - 5)) & "")
                    With rsAplicOP
                        .AddNew
                        .Fields("NroOP") = lPrimaryKey
                        .Fields("PtoVta") = Text4(i - 5)
                        .Fields("NroFact") = Text4(i - 4)
                        .Fields("ImpAplic") = Text4(i - 1)
                        .Fields("TipoComp") = rsCtaCteProv!TipoComp
                        .Update
                    End With
                    
                    rsCtaCteProv.Edit
                    rsCtaCteProv.LockEdits = True
                    rsCtaCteProv!SaldoComp = FormatNumber(rsCtaCteProv!SaldoComp - Text4(i - 1))
                    rsCtaCteProv.Update
                    rsCtaCteProv.LockEdits = False
                End If
            Else
                Exit For
            End If
        Next
        If Diferencia > 0 Then
            With rsAplicOP
                .AddNew
                .Fields("NroOP") = lPrimaryKey
                .Fields("ImpAplic") = FormatNumber(Diferencia)
                .Fields("ACta") = "SI"
                .Update
            End With
        End If
    Else
        With rsAplicOP
            .AddNew
            .Fields("NroOP") = lPrimaryKey
            .Fields("ImpAplic") = FormatNumber(Text1(46))
            .Update
        End With
    End If
    'graba recibo en cta cte
    With rsCtaCteProv
        .AddNew
        .Fields("Fecha") = Fecha
        .Fields("CodProv") = Text1(1)
        .Fields("PtoVta") = 1
        .Fields("NroComp") = lPrimaryKey
        .Fields("TipoComp") = 11
        .Fields("Debe") = FormatNumber(Text1(46))
        .Fields("SaldoComp") = FormatNumber(Diferencia)
        .Update
    End With
    With Msg_OP
        .Show
        .Height = 3105
        .Width = 6120
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .NroOP = lPrimaryKey
        .Text1 = Text1(2)
    End With

    'Call ImprimeOP(lPrimaryKey)
    Set rsEncabOP = Nothing
    Set rsChTer = Nothing
    Set rsAplicOP = Nothing
    Set rsCtaCteProv = Nothing
    Form_Load
Else
    MsgBox "La aplicación de Facturas no puede suepera al Total del Recibo", vbInformation
End If
End Sub

Private Sub AgregarCHP_Click()
On Error Resume Next
Dim lista1 As ListItem

If Not IsNumeric(Text2(1)) Then
    MsgBox "Datos Incorrecto", vbInformation
    Text2(1).SetFocus
    Exit Sub
ElseIf VtoCHPropio.Text = "__/__/___" Then
    MsgBox "Datos Incorrecto", vbInformation
    VtoCHPropio.SetFocus
    Exit Sub
ElseIf Text2(2) = "" Or Text2(2) = "0.00" Or Not IsNumeric(Text2(2)) Then
    MsgBox "Datos Incorrecto", vbInformation
    Text2(2).SetFocus
    Exit Sub
End If
'controla que no este en la lista
If Not CuentaCH_P = 0 Then
    i = 0
    For i = i + 1 To CuentaCH_P
    Set lista1 = ListCHP.ListItems.Item(i)
    If lista1.SubItems(2) = Text2(1) Then
        MsgBox "El cheque ya esta cargado en la lista"
        Exit Sub
    End If
    Next
End If
If CuentaCH_P < 7 Then
Set Lista = ListCHP.ListItems.Add(, , Text2(0))
Lista.Tag = Text2(0)
Lista.SubItems(1) = Label2(0)
Lista.SubItems(2) = Text2(1)
Lista.SubItems(3) = VtoCHPropio
Lista.SubItems(4) = FormatNumber(Text2(2))
Lista.SubItems(5) = "NO"
TCHPropios = TCHPropios + Text2(2)
TRec = TRec + TCHPropios
Text1(46) = FormatNumber(TRec)
Diferencia = TRec - TAplic
ZCH_P = Text2(2)
Text1(44) = FormatNumber(TCHPropios)
'Text1(8) = FormatNumber(TCHPropios)
'Text1(13) = FormatNumber(TRec)
'Text1(14) = FormatNumber(Diferencia)
Text1(46) = FormatNumber(TRec)
Text1(48) = FormatNumber(Diferencia)
Text1(53) = FormatNumber(TDescuentos)
i = 0
For i = i + 1 To Text2.Count
    If Not i = 3 Then
        Text2(i - 1) = ""
    Else
        Text2(i - 1) = "0.00"
    End If
Next
Label2(0) = ""
VtoCHPropio.Mask = ""
VtoCHPropio.Text = ""
VtoCHPropio.Mask = "##/##/####"
CuentaCH_P = CuentaCH_P + 1
Text2(0).SetFocus
Else
    MsgBox "No puede cargar más de 4 cheques"
End If

End Sub

Private Sub AgregarDesc_Click()
If Not Text1(52) = "" Then
    Set Lista = ListDescuentos.ListItems.Add(, , Text1(52))
        Lista.Tag = Text1(52)
        Lista.SubItems(1) = FormatNumber(Text1(51))
        Lista.SubItems(2) = FormatNumber(Text1(50))
        Lista.SubItems(3) = FormatNumber(Text1(49))
    TDescuentos = TDescuentos + Text1(51) + Text1(50) + Text1(49)
    TRec = TRec + Text1(51) + Text1(50) + Text1(49)
    Text1(46) = FormatNumber(TRec)
    Diferencia = TRec - TAplic
    Text1(48) = FormatNumber(Diferencia)
    Text1(53) = FormatNumber(TDescuentos)
    Text1(52) = "": Text1(51) = "0.00": Text1(50) = "0.00": Text1(49) = "0.0"
Else
    MsgBox "Nro Remito es obligatorios", vbInformation
    Text1(24).SetFocus
End If

End Sub

Private Sub AplicarFact_Click()
FEfvo.Visible = False
ChequesPropios.Visible = False
CHTerceros.Visible = False
FactPendientes.Visible = True
End Sub

Private Sub ChCartera_Click()
Dim x As ListItem
    Set x = ChCartera.ListItems.Item(ChCartera.SelectedItem.Index)
    Set Lista = CHTerAplic.ListItems.Add(, , x.Tag)
    Lista.Tag = x.Tag
    Lista.SubItems(1) = x.SubItems(1)
    Lista.SubItems(2) = x.SubItems(2)
    Lista.SubItems(3) = x.SubItems(3)
    TCHTer = TCHTer + x.SubItems(3)
    Text1(45) = FormatNumber(TCHTer)
    TRec = TRec + x.SubItems(3)
    Text1(46) = FormatNumber(TRec)
    Diferencia = TRec - TAplic
    Text1(48) = FormatNumber(Diferencia)
    ChCartera.ListItems.Remove (ChCartera.SelectedItem.Index)
End Sub

Private Sub CHPAdel_DblClick()
On Error Resume Next
Dim lista1 As ListItem
Dim x As ListItem
'controla que no este en la lista
If Not CuentaCH_P = 0 Then
    i = 0
    For i = i + 1 To CuentaCH_P
    Set lista1 = ListCHP.ListItems.Item(i)
    If lista1.SubItems(2) = Text2(1) Then
        MsgBox "El cheque ya esta cargado en la lista"
        Exit Sub
    End If
    Next
End If
If CuentaCH_P < 7 Then
Set x = CHPAdel.ListItems.Item(CHPAdel.SelectedItem.Index)
Set Lista = ListCHP.ListItems.Add(, , x.Tag)

Lista.Tag = x.Tag
Lista.SubItems(1) = x.SubItems(1)
Lista.SubItems(2) = x.SubItems(2)
Lista.SubItems(3) = x.SubItems(3)
Lista.SubItems(4) = x.SubItems(4)
Lista.SubItems(5) = "NO"
TCHPropios = TCHPropios + x.SubItems(4)
TRec = TRec + TCHPropios
Text1(46) = FormatNumber(TRec)
Diferencia = TRec - TAplic
ZCH_P = x.SubItems(4)
Text1(44) = FormatNumber(TCHPropios)
Label2(1) = FormatNumber(TCHPropios)
'Text1(8) = FormatNumber(TCHPropios)
'Text1(13) = FormatNumber(TRec)
'Text1(14) = FormatNumber(Diferencia)
Text1(46) = FormatNumber(TRec)
Text1(48) = FormatNumber(Diferencia)
Text1(53) = FormatNumber(TDescuentos)
CHPAdel.ListItems.Remove (CHPAdel.SelectedItem.Index)
Text2(0).SetFocus
Else
    MsgBox "No puede cargar más de 4 cheques"
End If



End Sub

Private Sub CHProp_Click()
FEfvo.Visible = False
ChequesPropios.Visible = True
CHTerceros.Visible = False
FactPendientes.Visible = False

End Sub

Private Sub CHTerAplic_Click()
Dim x As ListItem
Set x = CHTerAplic.ListItems.Item(CHTerAplic.SelectedItem.Index)
    Set Lista = ChCartera.ListItems.Add(, , x.Tag)
    Lista.Tag = x.Tag
    Lista.SubItems(1) = x.SubItems(1)
    Lista.SubItems(2) = x.SubItems(2)
    Lista.SubItems(3) = x.SubItems(3)
    TCHTer = TCHTer - x.SubItems(3)
    Text1(45) = FormatNumber(TCHTer)
    TRec = TRec - x.SubItems(3)
    Text1(46) = FormatNumber(TRec)
    Diferencia = TRec - TAplic
    Text1(48) = FormatNumber(Diferencia)
    CHTerAplic.ListItems.Remove (CHTerAplic.SelectedItem.Index)
End Sub

Private Sub CHTerc_Click()
FEfvo.Visible = False
ChequesPropios.Visible = False
CHTerceros.Visible = True
FactPendientes.Visible = False

End Sub

Private Sub DescPendientes_DblClick()
Set LDescGO = DescPendientes.ListItems.Item(DescPendientes.SelectedItem.Index)
Text1(52) = LDescGO.SubItems(2)
Text1(50) = LDescGO.SubItems(3)
Text1(51) = "0.00"
Text1(49) = "0.00"
DescPendientes.ListItems.Remove (DescPendientes.SelectedItem.Index)
End Sub

Private Sub Efectivo_Click()
FEfvo.Visible = True
ChequesPropios.Visible = False
CHTerceros.Visible = False
FactPendientes.Visible = False
Text1(3).SetFocus
End Sub

Private Sub Form_Load()
On Error Resume Next
TAplic = 0: TCH = 0: TEfvo = 0: Diferencia = 0: TRec = 0: TOConc = 0
Aplic = 0: Efvo = 0: Cheques = 0: OConc = 0: TCHTer = 0: VALOR = 0
FEfvo.Visible = False
ChequesPropios.Visible = False
CHTerceros.Visible = False
FactPendientes.Visible = False
ChCartera.ListItems.Clear
Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where Estado = 'En Cartera' Order By FechaVto")
Do While Not rsChTer.EOF
    Set Lista = ChCartera.ListItems.Add(, , rsChTer!NroCH)
        Lista.Tag = rsChTer!NroCH
        Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsChTer!CodBanco & "")
        Lista.SubItems(1) = rsBcos!DescBco
        Set rsBcos = Nothing
        Lista.SubItems(2) = rsChTer!FechaVto
        Lista.SubItems(3) = FormatNumber(rsChTer!Importe)
    rsChTer.MoveNext
Loop
Set rsChTer = Nothing
i = 0
For i = i + 1 To Text1.Count
   Text1(i - 1) = ""
Next
Text1(53) = "0.00": Text1(46) = "0.00": Text1(47) = "0.00": Text1(48) = "0.00"
Text1(3) = "0.00": Text1(44) = "0.00": Text1(45) = "0.00"
Text1(51) = "0.00"
Text1(50) = "0.00"
Text1(49) = "0.00"
Text1(52) = ""
i = 0
For i = i + 1 To Text2.Count
    Text2(i - 1) = ""
Next
i = 0
For i = i + 1 To Label2.Count
    Label2(i - 1).Caption = ""
Next
Label2(1) = "0.00"
For i = i + 1 To Text4.Count
    If i Mod 6 = 0 Then
        Text4(i - 1) = "0.00"
    Else
        Text4(i - 1) = ""
    End If
Next
i = 0
For i = i + 1 To FechaCHP.Count
    FechaCHP(i - 1).Mask = ""
    FechaCHP(i - 1).Text = ""
    FechaCHP(i - 1).Mask = "##/##/####"
Next
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"
VtoCHPropio.Mask = ""
VtoCHPropio.Text = ""
VtoCHPropio.Mask = "##/##/####"

End Sub

Private Sub LCHTAdel_DblClick()
Dim x As ListItem
If CuentaCH_T < 7 Then
    Set x = LCHTAdel.ListItems.Item(LCHTAdel.SelectedItem.Index)
    Set Lista = CHTerAplic.ListItems.Add(, , x.Tag)
    Lista.Tag = x.Tag
    Lista.SubItems(1) = x.SubItems(1)
    Lista.SubItems(2) = x.SubItems(2)
    Lista.SubItems(3) = x.SubItems(3)
    Lista.SubItems(4) = "SI"
    TCHTer = TCHTer + x.SubItems(3)
    Text1(45) = FormatNumber(TCHTer)
    TRec = TRec + x.SubItems(3)
    Text1(46) = FormatNumber(TRec)
    Diferencia = TRec - TAplic
    Text1(48) = FormatNumber(Diferencia)
    CuentaCH_T = CuentaCH_T + 1
    LCHTAdel.ListItems.Remove (LCHTAdel.SelectedItem.Index)
Else
    MsgBox "No se puede Cargar más de 4 cheques", vbInformation
End If

End Sub

Private Sub Text1_GotFocus(Index As Integer)
Select Case Index
Case 3:
    Efvo = Text1(3)
Case 7, 11, 15, 19, 23, 27, 31, 35, 39, 43:
        Cheques = Text1(Index)
        Tamaño = Len(Text1(Index))
        Text1(Index).SelStart = 0
        Text1(Index).SelLength = Tamaño

End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
Select Case Index
Case 1:
    If Not Text1(1) = "" Then
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(1) & "")
    If Not rsFleteros.EOF And Not rsFleteros.BOF Then
        Text1(2) = rsFleteros!DescFlet
    End If
    Set rsFleteros = Nothing
    'busca facturas con saldo
    Set rsCtaCteProv = db.OpenRecordset("Select * From CtaCteProv Where CodProv = " & Text1(1) & " And SaldoComp > 0 Order By Fecha desc")
    x = 0
    i = 0
    For i = i + 1 To Text4.Count
        If i Mod 6 = 0 Then
            Text4(i - 1) = "0.00"
        Else
            Text4(i - 1) = ""
        End If
    Next
    Do While Not rsCtaCteProv.EOF
        If rsCtaCteProv!TipoComp = 1 Or rsCtaCteProv!TipoComp = 60 Or rsCtaCteProv!TipoComp = 2 Then
        If x < 216 Then
        Text4(0 + x) = rsCtaCteProv!Fecha
        Tamaño = Len(rsCtaCteProv!PtoVta)
        Select Case Tamaño
            Case 1: VPtoVta = "000" & rsCtaCteProv!PtoVta
            Case 2: VPtoVta = "00" & rsCtaCteProv!PtoVta
            Case 3: VPtoVta = "0" & rsCtaCteProv!PtoVta
            Case 4: VPtoVta = rsCtaCteProv!PtoVta
        End Select
        Text4(1 + x) = VPtoVta
        Tamaño = Len(rsCtaCteProv!NroComp)
        Select Case Tamaño
            Case 1: VNro = "0000000" & rsCtaCteProv!NroComp
            Case 2: VNro = "000000" & rsCtaCteProv!NroComp
            Case 3: VNro = "00000" & rsCtaCteProv!NroComp
            Case 4: VNro = "0000" & rsCtaCteProv!NroComp
            Case 5: VNro = "000" & rsCtaCteProv!NroComp
            Case 6: VNro = "00" & rsCtaCteProv!NroComp
            Case 7: VNro = "0" & rsCtaCteProv!NroComp
            Case 8: VNro = rsCtaCteProv!NroComp
        End Select
        Text4(2 + x) = VNro
        Text4(3 + x) = FormatNumber(rsCtaCteProv!Haber)
        Text4(4 + x) = FormatNumber(rsCtaCteProv!SaldoComp)
        Text4(5 + x) = "0.00"
        x = x + 6
        End If
    End If
        rsCtaCteProv.MoveNext
    Loop
    Set rsCtaCteProv = Nothing
    'busca descuentos pendiente
    DescPendientes.ListItems.Clear
    Set rsGasOilFleteros = db.OpenRecordset("SELECT * FROM GasOilFleteros WHERE CodFlet = " & Text1(1) & "")
    Do While Not rsGasOilFleteros.EOF
    If rsGasOilFleteros!codflet = Text1(1) And rsGasOilFleteros!Descontada = "NO" Then
        Set LDescGO = DescPendientes.ListItems.Add(, , rsGasOilFleteros!Fecha)
        LDescGO.Tag = rsGasOilFleteros.Fields("Fecha")
        LDescGO.SubItems(1) = rsGasOilFleteros.Fields("PtoVta")
        LDescGO.SubItems(2) = rsGasOilFleteros.Fields("NroFact")
        LDescGO.SubItems(3) = FormatNumber(rsGasOilFleteros.Fields("Importe"))
    End If
        rsGasOilFleteros.MoveNext
    Loop
    Set rsGasOilFleteros = Nothing
    Set rsDetAdelCHP = db.OpenRecordset("Select * From DetAdelCHP Where CodProv = " & Text1(1) & " AND Descontado = 'NO'")
    Do While Not rsDetAdelCHP.EOF
        Set Lista = CHPAdel.ListItems.Add(, , rsDetAdelCHP!Cuenta)
        Lista.Tag = rsDetAdelCHP!Cuenta
        Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & rsDetAdelCHP!Cuenta & "'")
        Lista.SubItems(1) = rsCtaBcoPropias!DescBco
        Lista.SubItems(2) = rsDetAdelCHP!NroCH
        Lista.SubItems(3) = rsDetAdelCHP!Vto
        Lista.SubItems(4) = FormatNumber(rsDetAdelCHP!Importe)
        rsDetAdelCHP.MoveNext
    Loop
    Set rsDetAdelCHT = db.OpenRecordset("Select * From DetAdelCHT Where CodProv = " & Text1(1) & " AND Descontado = 'NO'")
    Do While Not rsDetAdelCHT.EOF
    Set Lista = LCHTAdel.ListItems.Add(, , rsDetAdelCHT!NroCH)
        Lista.Tag = rsDetAdelCHT!NroCH
        Set rsBcos = db.OpenRecordset("Select * From Bancos Where CodBco = " & rsDetAdelCHT!CodBco & "")
        Lista.SubItems(1) = rsBcos!DescBco
        Set rsBcos = Nothing
        Lista.SubItems(2) = rsDetAdelCHT!Vto
        Lista.SubItems(3) = FormatNumber(rsDetAdelCHT!Importe)
        rsDetAdelCHT.MoveNext
    Loop
    Exit Sub
    End If
Case 3:
    Text1(3) = FormatNumber(Text1(3))
    TEfvo = TEfvo - Efvo + Text1(3)
    TRec = TRec - Efvo + Text1(3)
    Text1(46) = FormatNumber(TRec)
    Diferencia = TRec - TAplic
    Text1(48) = FormatNumber(Diferencia)

Case 7, 11, 15, 19, 23, 27, 31, 35, 39, 43:
    TCH = TCH - Cheques + Text1(Index)
    TRec = TRec - Cheques + Text1(Index)
    Diferencia = TRec - TAplic
    Text1(46) = FormatNumber(TRec)
    Text1(48) = FormatNumber(Diferencia)
    Text1(44) = FormatNumber(TCH)
    Text1(Index) = FormatNumber(Text1(Index))
    
Case 4, 8, 12, 16, 20, 24, 28, 32, 36, 40:
    If Not Text1(Index) = "" Then
        Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & Text1(Index) & "'")
        If Not rsCtaBcoPropias.EOF And Not rsCtaBcoPropias.BOF Then
            Text1(Index + 1) = rsCtaBcoPropias!DescBco
        Else
            MsgBox "La Cuenta no existe", vbInformation
            Text1(Index).SetFocus
        End If
        Set rsCtaBcoPropias = Nothing
    End If
    
End Select
End Sub

Private Sub Text2_LostFocus(Index As Integer)
'On Error Resume Next
Select Case Index
Case 0:
    If Not Text2(0) = "" Then
        Set rsCtaBcoPropias = db.OpenRecordset("Select * from CtaCtePropias Where CtaCte = '" & Text2(0) & "'")
        If Not rsCtaBcoPropias.EOF And Not rsCtaBcoPropias.BOF Then
            Label2(0) = rsCtaBcoPropias!DescBco
        Else
            MsgBox "La Cuenta no existe", vbInformation
            Text2(0).Text = ""
            Text2(0).SetFocus
        End If
        Set rsCtaBcoPropias = Nothing
    End If
Case 1:
   Set rsCHEmitidos = db.OpenRecordset("Select * From CHEmitidos Where CtaCte = '" & Text2(1) & "' and NroComp = " & Text2(1) & "")
   If Not rsCHEmitidos.EOF And Not rsCHEmitidos.BOF Then
        MsgBox "EL CHEQUE YA FUE EMITIDO"
        Text2(1) = ""
    End If
End Select
End Sub

Private Sub Text4_GotFocus(Index As Integer)
Select Case Index
Case 5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 95, 101, 107, 113, 119, 125, 131, 137, 143, 149, 155, 161, 167, 173, 179, 185, 191, 197, 203, 209, 215:
        Tamaño = Len(Text4(Index))
        Text4(Index).SelStart = 0
        Text4(Index).SelLength = Tamaño
        Aplic = Text4(Index)
        Text4(Index).SetFocus
End Select
End Sub

Private Sub Text4_LostFocus(Index As Integer)
Select Case Index
Case 5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 95, 101, 107, 113, 119, 125, 131, 137, 143, 149, 155, 161, 167, 173, 179, 185, 191, 197, 203, 209, 215:
        Text4(Index) = FormatNumber(Text4(Index))
        TAplic = TAplic - Aplic + Text4(Index)
        Diferencia = TRec - TAplic
        Text1(46) = FormatNumber(TRec)
        Diferencia = TRec - TAplic
        Text1(48) = FormatNumber(Diferencia)
        Text1(53) = FormatNumber(TDescuentos)
        
        Text1(47) = FormatNumber(TAplic)
        Text1(48) = FormatNumber(Diferencia)
End Select
End Sub

Private Sub VScroll1_Change()
If VALOR <= VScroll1.Value Then
    i = 0
    For i = i + 1 To Text4.Count
         Text4(i - 1).Top = Text4(i - 1).Top - (VScroll1.Value)
    Next
ElseIf VALOR = 0 Then
    i = 0
    For i = i + 1 To Text4.Count
         Text4(i - 1).Top = 240
    Next
Else
    i = 0
    For i = i + 1 To Text4.Count
         Text4(i - 1).Top = Text4(i - 1).Top + (VScroll1.Value)
    Next
End If
VALOR = VScroll1.Value
End Sub
