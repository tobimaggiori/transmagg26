VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form Principal 
   BorderStyle     =   1  'Fixed Single
   Caption         =   "llll"
   ClientHeight    =   8685
   ClientLeft      =   45
   ClientTop       =   435
   ClientWidth     =   13455
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MDIChild        =   -1  'True
   MinButton       =   0   'False
   ScaleHeight     =   8685
   ScaleWidth      =   13455
   WindowState     =   2  'Maximized
   Begin VB.Frame Menu 
      Caption         =   "Menu"
      Height          =   8655
      Left            =   120
      TabIndex        =   0
      Top             =   0
      Width           =   1935
      Begin VB.CommandButton ConsCtaCte 
         Caption         =   "Consultar Cta Cte"
         Height          =   375
         Left            =   240
         TabIndex        =   71
         Top             =   1920
         Width           =   1455
      End
      Begin VB.CommandButton FacturarViajes 
         Caption         =   "Facturar Viajes"
         Height          =   375
         Left            =   240
         TabIndex        =   42
         Top             =   1440
         Width           =   1455
      End
      Begin VB.CommandButton ProveedoresABM 
         Caption         =   "ABMProveedores"
         Height          =   375
         Left            =   240
         TabIndex        =   28
         Top             =   960
         Width           =   1455
      End
      Begin VB.CommandButton EmpresasABM 
         Caption         =   "ABMEmpresas"
         Height          =   375
         Left            =   240
         TabIndex        =   22
         Top             =   480
         Width           =   1455
      End
   End
   Begin VB.Frame FCtaCte 
      Caption         =   "Consulta de Cta Cte"
      Height          =   5775
      Left            =   2160
      TabIndex        =   72
      Top             =   0
      Visible         =   0   'False
      Width           =   11175
      Begin VB.CommandButton Command1 
         Caption         =   "Consultar"
         Height          =   375
         Left            =   6720
         TabIndex        =   80
         Top             =   480
         Width           =   1455
      End
      Begin MSMask.MaskEdBox FHasta 
         Height          =   255
         Left            =   4200
         TabIndex        =   76
         Top             =   960
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   450
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FDesde 
         Height          =   255
         Left            =   1560
         TabIndex        =   75
         Top             =   960
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   450
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.TextBox Text6 
         Height          =   285
         Index           =   1
         Left            =   2520
         TabIndex        =   74
         Text            =   "Text6"
         Top             =   480
         Width           =   4095
      End
      Begin VB.TextBox Text6 
         Height          =   285
         Index           =   0
         Left            =   1560
         TabIndex        =   73
         Text            =   "Text6"
         Top             =   480
         Width           =   855
      End
      Begin MSComctlLib.ListView CtaCte 
         Height          =   4095
         Left            =   120
         TabIndex        =   81
         Top             =   1320
         Width           =   10905
         _ExtentX        =   19235
         _ExtentY        =   7223
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
         NumItems        =   8
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "CodComp"
            Object.Width           =   882
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Comprobante"
            Object.Width           =   3528
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Número"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Debe"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Haber"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Saldo"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Saldo Comp"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.Label Label37 
         Caption         =   "Hasta"
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
         Left            =   3000
         TabIndex        =   79
         Top             =   960
         Width           =   1455
      End
      Begin VB.Label Label36 
         Caption         =   "Desde"
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
         TabIndex        =   78
         Top             =   960
         Width           =   1455
      End
      Begin VB.Label Label35 
         Caption         =   "Cliente"
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
         TabIndex        =   77
         Top             =   480
         Width           =   1455
      End
   End
   Begin VB.Frame Facturar 
      Caption         =   "Facturar"
      Height          =   8055
      Left            =   2160
      TabIndex        =   29
      Top             =   0
      Visible         =   0   'False
      Width           =   9615
      Begin MSMask.MaskEdBox FFact 
         Height          =   255
         Left            =   4560
         TabIndex        =   41
         Top             =   360
         Width           =   1095
         _ExtentX        =   1931
         _ExtentY        =   450
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   4
         Left            =   3720
         TabIndex        =   39
         Text            =   "Text3"
         Top             =   1080
         Width           =   1935
      End
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   3
         Left            =   1080
         TabIndex        =   38
         Text            =   "Text3"
         Top             =   1080
         Width           =   1935
      End
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   2
         Left            =   1080
         TabIndex        =   37
         Text            =   "Text3"
         Top             =   720
         Width           =   4575
      End
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   1
         Left            =   1800
         TabIndex        =   36
         Text            =   "Text3"
         Top             =   360
         Width           =   2055
      End
      Begin VB.TextBox Text3 
         Height          =   285
         Index           =   0
         Left            =   1080
         TabIndex        =   35
         Text            =   "Text3"
         Top             =   360
         Width           =   615
      End
      Begin VB.Frame BuscaEmpresas 
         Caption         =   "BuscarEmpresas"
         Height          =   2895
         Left            =   1560
         TabIndex        =   66
         Top             =   3120
         Visible         =   0   'False
         Width           =   5895
         Begin VB.TextBox Text5 
            Height          =   285
            Left            =   1080
            TabIndex        =   69
            Text            =   "Text5"
            Top             =   2280
            Width           =   4575
         End
         Begin MSComctlLib.ListView ListEmpresas 
            Height          =   1815
            Left            =   240
            TabIndex        =   67
            Top             =   360
            Width           =   5500
            _ExtentX        =   9710
            _ExtentY        =   3201
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
            NumItems        =   2
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "CodEmpresas"
               Object.Width           =   2540
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Descripcion"
               Object.Width           =   7056
            EndProperty
         End
         Begin VB.Label Label34 
            Alignment       =   2  'Center
            Caption         =   "Buscar"
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
            Left            =   240
            TabIndex        =   68
            Top             =   2280
            Width           =   855
         End
      End
      Begin VB.Frame DetalleFact 
         Caption         =   "Detalle Factura"
         Height          =   6495
         Left            =   120
         TabIndex        =   40
         Top             =   1440
         Width           =   9375
         Begin VB.CommandButton GrabarFact 
            Caption         =   "Grabar Factura"
            Height          =   495
            Left            =   1440
            TabIndex        =   70
            Top             =   5400
            Width           =   3615
         End
         Begin VB.TextBox Text4 
            Height          =   285
            Index           =   2
            Left            =   7800
            TabIndex        =   62
            Text            =   "Text4"
            Top             =   6000
            Width           =   1095
         End
         Begin VB.TextBox Text4 
            Height          =   285
            Index           =   1
            Left            =   7800
            TabIndex        =   61
            Text            =   "Text4"
            Top             =   5640
            Width           =   1095
         End
         Begin VB.TextBox Text4 
            Height          =   285
            Index           =   0
            Left            =   7800
            TabIndex        =   60
            Text            =   "Text4"
            Top             =   5280
            Width           =   1095
         End
         Begin MSComctlLib.ListView LDetFact 
            Height          =   4215
            Left            =   120
            TabIndex        =   59
            Top             =   960
            Width           =   9135
            _ExtentX        =   16113
            _ExtentY        =   7435
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
            NumItems        =   8
            BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               Text            =   "Fecha"
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   1
               Text            =   "Remito"
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   2
               Text            =   "Mercaderia"
               Object.Width           =   2355
            EndProperty
            BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   3
               Text            =   "Procedencia"
               Object.Width           =   2355
            EndProperty
            BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   4
               Text            =   "Destino"
               Object.Width           =   2355
            EndProperty
            BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   5
               Text            =   "Kilos"
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   6
               Text            =   "Tarifa"
               Object.Width           =   1720
            EndProperty
            BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
               SubItemIndex    =   7
               Text            =   "STotal"
               Object.Width           =   1720
            EndProperty
         End
         Begin VB.TextBox Text3 
            Height          =   285
            Index           =   11
            Left            =   7680
            TabIndex        =   58
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin VB.TextBox Text3 
            Height          =   285
            Index           =   10
            Left            =   6720
            TabIndex        =   57
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin VB.TextBox Text3 
            Height          =   285
            Index           =   9
            Left            =   5760
            TabIndex        =   56
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin VB.TextBox Text3 
            Height          =   285
            Index           =   8
            Left            =   4560
            TabIndex        =   55
            Text            =   "Text3"
            Top             =   600
            Width           =   1215
         End
         Begin VB.TextBox Text3 
            Height          =   285
            Index           =   7
            Left            =   3360
            TabIndex        =   54
            Text            =   "Text3"
            Top             =   600
            Width           =   1215
         End
         Begin VB.TextBox Text3 
            Height          =   285
            Index           =   6
            Left            =   2040
            TabIndex        =   53
            Text            =   "Text3"
            Top             =   600
            Width           =   1335
         End
         Begin VB.TextBox Text3 
            Height          =   285
            Index           =   5
            Left            =   1080
            TabIndex        =   52
            Text            =   "Text3"
            Top             =   600
            Width           =   975
         End
         Begin MSMask.MaskEdBox FViaje 
            Height          =   285
            Left            =   120
            TabIndex        =   51
            Top             =   600
            Width           =   975
            _ExtentX        =   1720
            _ExtentY        =   503
            _Version        =   393216
            PromptChar      =   "_"
         End
         Begin VB.Label Label33 
            Caption         =   "Localidad"
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
            Left            =   6240
            TabIndex        =   65
            Top             =   6000
            Width           =   1455
         End
         Begin VB.Label Label32 
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
            Left            =   6240
            TabIndex        =   64
            Top             =   5640
            Width           =   1455
         End
         Begin VB.Label Label31 
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
            Left            =   6240
            TabIndex        =   63
            Top             =   5280
            Width           =   1455
         End
         Begin VB.Label Label30 
            Alignment       =   2  'Center
            Caption         =   "SubTotal"
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
            Left            =   7680
            TabIndex        =   50
            Top             =   360
            Width           =   975
         End
         Begin VB.Label Label29 
            Alignment       =   2  'Center
            Caption         =   "Tarifa"
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
            Left            =   6720
            TabIndex        =   49
            Top             =   360
            Width           =   975
         End
         Begin VB.Label Label28 
            Alignment       =   2  'Center
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
            Left            =   5760
            TabIndex        =   48
            Top             =   360
            Width           =   975
         End
         Begin VB.Label Label27 
            Alignment       =   2  'Center
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
            Left            =   4560
            TabIndex        =   47
            Top             =   360
            Width           =   1215
         End
         Begin VB.Label Label26 
            Alignment       =   2  'Center
            Caption         =   "Procedencia"
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
            Left            =   3360
            TabIndex        =   46
            Top             =   360
            Width           =   1215
         End
         Begin VB.Label Label25 
            Alignment       =   2  'Center
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
            Left            =   2040
            TabIndex        =   45
            Top             =   360
            Width           =   1335
         End
         Begin VB.Label Label24 
            Alignment       =   2  'Center
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
            Left            =   1200
            TabIndex        =   44
            Top             =   360
            Width           =   855
         End
         Begin VB.Label Label23 
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
            Left            =   240
            TabIndex        =   43
            Top             =   360
            Width           =   615
         End
      End
      Begin VB.Label Label22 
         Caption         =   "CUIT"
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
         Left            =   3120
         TabIndex        =   34
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Label15 
         Caption         =   "Localidad"
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
         TabIndex        =   33
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Label13 
         Caption         =   "Dirección"
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
         TabIndex        =   32
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label12 
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
         Left            =   3960
         TabIndex        =   31
         Top             =   360
         Width           =   1455
      End
      Begin VB.Label Label10 
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
         Left            =   120
         TabIndex        =   30
         Top             =   360
         Width           =   1455
      End
   End
   Begin VB.Frame ABMProveedores 
      Caption         =   "ABM Proveedores"
      Height          =   3735
      Left            =   2160
      TabIndex        =   82
      Top             =   0
      Visible         =   0   'False
      Width           =   7575
      Begin VB.TextBox Text2 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   6
         Left            =   1920
         TabIndex        =   95
         Text            =   "Text1"
         Top             =   1800
         Width           =   4575
      End
      Begin VB.TextBox Text2 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   5
         Left            =   4560
         TabIndex        =   94
         Text            =   "Text1"
         Top             =   1440
         Width           =   1935
      End
      Begin VB.TextBox Text2 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   4
         Left            =   1920
         TabIndex        =   93
         Text            =   "Text1"
         Top             =   1440
         Width           =   2055
      End
      Begin VB.TextBox Text2 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   3
         Left            =   3960
         TabIndex        =   92
         Text            =   "Text1"
         Top             =   1080
         Width           =   2535
      End
      Begin VB.TextBox Text2 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   2
         Left            =   1920
         TabIndex        =   91
         Text            =   "Text1"
         Top             =   1080
         Width           =   975
      End
      Begin VB.TextBox Text2 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   1
         Left            =   1920
         TabIndex        =   90
         Text            =   "Text1"
         Top             =   720
         Width           =   4575
      End
      Begin VB.TextBox Text2 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   0
         Left            =   1920
         TabIndex        =   89
         Text            =   "Text1"
         Top             =   360
         Width           =   4575
      End
      Begin VB.ComboBox Combo2 
         Height          =   315
         Left            =   1920
         TabIndex        =   88
         Text            =   "Combo1"
         Top             =   2160
         Width           =   1935
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   "<<"
         Height          =   435
         Index           =   0
         Left            =   4320
         TabIndex        =   87
         Top             =   2400
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   "<"
         Height          =   435
         Index           =   1
         Left            =   4800
         TabIndex        =   86
         Top             =   2400
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   ">"
         Height          =   435
         Index           =   2
         Left            =   5340
         TabIndex        =   85
         Top             =   2400
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   ">>"
         Height          =   435
         Index           =   3
         Left            =   5820
         TabIndex        =   84
         Top             =   2400
         Width           =   495
      End
      Begin VB.ComboBox IIBB 
         Height          =   315
         Left            =   1920
         TabIndex        =   83
         Text            =   "IIBB"
         Top             =   2520
         Width           =   2295
      End
      Begin KewlButtonz.KewlButtons CancelarProv 
         Height          =   495
         Left            =   6120
         TabIndex        =   96
         Top             =   3000
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cancelar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":0000
         PICN            =   "Principal.frx":001C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons AceptarProv 
         Height          =   495
         Left            =   4680
         TabIndex        =   97
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Aceptar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":05B6
         PICN            =   "Principal.frx":05D2
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons BuscarProv 
         Height          =   495
         Left            =   3000
         TabIndex        =   98
         Top             =   3000
         Width           =   1575
         _ExtentX        =   2778
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Buscar"
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
         MICON           =   "Principal.frx":2654
         PICN            =   "Principal.frx":2670
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons EliminaProv 
         Height          =   495
         Left            =   120
         TabIndex        =   99
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Eliminar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":437A
         PICN            =   "Principal.frx":4396
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons CambiaProv 
         Height          =   495
         Left            =   1560
         TabIndex        =   100
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cambiar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":4930
         PICN            =   "Principal.frx":494C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label21 
         Caption         =   "Descripcion"
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
         Left            =   360
         TabIndex        =   109
         Top             =   360
         Width           =   1455
      End
      Begin VB.Label Label20 
         Caption         =   "Dirección"
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
         Left            =   360
         TabIndex        =   108
         Top             =   720
         Width           =   1455
      End
      Begin VB.Label Label19 
         Caption         =   "Código Postal"
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
         Left            =   360
         TabIndex        =   107
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Label18 
         Caption         =   "Localidad"
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
         Left            =   3000
         TabIndex        =   106
         Top             =   1080
         Width           =   1455
      End
      Begin VB.Label Label17 
         Caption         =   "Telefono"
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
         Left            =   360
         TabIndex        =   105
         Top             =   1440
         Width           =   1455
      End
      Begin VB.Label Label16 
         Caption         =   "Email"
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
         Left            =   360
         TabIndex        =   104
         Top             =   1800
         Width           =   1455
      End
      Begin VB.Label Label14 
         Caption         =   "Condición IVA"
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
         Left            =   360
         TabIndex        =   103
         Top             =   2160
         Width           =   1455
      End
      Begin VB.Label Label7 
         Caption         =   "CUIT"
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
         Left            =   4080
         TabIndex        =   102
         Top             =   1440
         Width           =   975
      End
      Begin VB.Label Label11 
         Caption         =   "Ingreso Brutos"
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
         Left            =   360
         TabIndex        =   101
         Top             =   2520
         Width           =   1455
      End
   End
   Begin VB.Frame ABMEmpresas 
      Caption         =   "ABMEmpresas"
      Height          =   4335
      Left            =   2160
      TabIndex        =   1
      Top             =   0
      Visible         =   0   'False
      Width           =   7575
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   0
         Left            =   1560
         TabIndex        =   13
         Text            =   "Text1"
         Top             =   600
         Width           =   5775
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   1
         Left            =   1560
         TabIndex        =   12
         Text            =   "Text1"
         Top             =   960
         Width           =   5775
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   2
         Left            =   1560
         TabIndex        =   11
         Text            =   "Text1"
         Top             =   1320
         Width           =   1095
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   3
         Left            =   3720
         TabIndex        =   10
         Text            =   "Text1"
         Top             =   1320
         Width           =   3615
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   4
         Left            =   1560
         TabIndex        =   9
         Text            =   "Text1"
         Top             =   1680
         Width           =   5775
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   5
         Left            =   1560
         TabIndex        =   8
         Text            =   "Text1"
         Top             =   2040
         Width           =   5775
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   6
         Left            =   1560
         TabIndex        =   7
         Text            =   "Text1"
         Top             =   2400
         Width           =   1695
      End
      Begin VB.ComboBox Combo1 
         Height          =   315
         Left            =   4680
         TabIndex        =   6
         Text            =   "Combo1"
         Top             =   2400
         Width           =   2655
      End
      Begin VB.CommandButton cmdMover 
         Caption         =   ">>"
         Height          =   435
         Index           =   3
         Left            =   4440
         TabIndex        =   5
         Top             =   2880
         Width           =   495
      End
      Begin VB.CommandButton cmdMover 
         Caption         =   ">"
         Height          =   435
         Index           =   2
         Left            =   3900
         TabIndex        =   4
         Top             =   2880
         Width           =   495
      End
      Begin VB.CommandButton cmdMover 
         Caption         =   "<"
         Height          =   435
         Index           =   1
         Left            =   3360
         TabIndex        =   3
         Top             =   2880
         Width           =   495
      End
      Begin VB.CommandButton cmdMover 
         Caption         =   "<<"
         Height          =   435
         Index           =   0
         Left            =   2880
         TabIndex        =   2
         Top             =   2880
         Width           =   495
      End
      Begin KewlButtonz.KewlButtons Modificar 
         Height          =   495
         Left            =   1560
         TabIndex        =   23
         Top             =   3600
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cambiar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":9F5E
         PICN            =   "Principal.frx":9F7A
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Eliminar 
         Height          =   495
         Left            =   360
         TabIndex        =   24
         Top             =   3600
         Width           =   1095
         _ExtentX        =   1931
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Eliminar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":F58C
         PICN            =   "Principal.frx":F5A8
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Buscar 
         Height          =   495
         Left            =   3000
         TabIndex        =   25
         Top             =   3600
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Buscar"
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
         MICON           =   "Principal.frx":FB42
         PICN            =   "Principal.frx":FB5E
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
         Height          =   495
         Left            =   4440
         TabIndex        =   26
         Top             =   3600
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Aceptar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":11868
         PICN            =   "Principal.frx":11884
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
         Height          =   495
         Left            =   5880
         TabIndex        =   27
         Top             =   3600
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cancelar"
         ENAB            =   0   'False
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
         MICON           =   "Principal.frx":13906
         PICN            =   "Principal.frx":13922
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
         Caption         =   "Razón Social"
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
         TabIndex        =   21
         Top             =   600
         Width           =   1455
      End
      Begin VB.Label Label2 
         Caption         =   "Dirección"
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
         TabIndex        =   20
         Top             =   960
         Width           =   1455
      End
      Begin VB.Label Label9 
         Caption         =   "CUIT"
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
         TabIndex        =   19
         Top             =   2400
         Width           =   975
      End
      Begin VB.Label Label8 
         Caption         =   "Condición IVA"
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
         Left            =   3360
         TabIndex        =   18
         Top             =   2400
         Width           =   1455
      End
      Begin VB.Label Label6 
         Caption         =   "Email"
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
         TabIndex        =   17
         Top             =   2040
         Width           =   1455
      End
      Begin VB.Label Label5 
         Caption         =   "Telefono"
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
         TabIndex        =   16
         Top             =   1680
         Width           =   1455
      End
      Begin VB.Label Label4 
         Caption         =   "Localidad"
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
         Left            =   2760
         TabIndex        =   15
         Top             =   1320
         Width           =   1455
      End
      Begin VB.Label Label3 
         Caption         =   "Código Postal"
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
         TabIndex        =   14
         Top             =   1320
         Width           =   1455
      End
   End
End
Attribute VB_Name = "Principal"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Dim LEmpresas As ListItem, Viene As String
Private Sub Aceptar_Click()
If Accion = "Nuevo" Then
On Error GoTo ERR_cmdAltaRegistro:
    Dim nAccessValue As Integer
    Screen.MousePointer = vbHourglass
    nAccessValue = 0
    ' aplica los permisos deseados por el usuario
    nAccessValue = nAccessValue + dbDenyWrite
    Set rsEmpresas = db.OpenRecordset("Empresas")
    Dim lPrimaryKey As Long
    Dim sMessage As String
    ' recupera una clave única desde la rutina GetPrimaryKey
    lPrimaryKey = CodigoEmpresas
        With rsEmpresas
            .AddNew
            .Fields("CodEmpresas") = lPrimaryKey
            .Fields("DescEmpresas") = Text1(0)
            .Fields("Direccion") = Text1(1)
            .Fields("Telefono") = Text1(4)
            .Fields("EMail") = Text1(5)
            .Fields("CUIT") = Text1(6)
            .Fields("CP") = Text1(2)
            .Fields("Localidad") = Text1(3)
            .Fields("CodIVA") = Combo1.ListIndex + 1
            .Update
        End With
        Set rsEmpresas = Nothing
        Combo1.ListIndex = 0
        Items = 0
        For Items = Items + 1 To Text1.Count
            Text1(Items - 1) = ""
        Next
        Aceptar.Enabled = True: Cancelar.Enabled = True: Buscar.Enabled = True: Eliminar.Enabled = False
        Accion = "Nuevo"
        ' Si el código pasa por aquí es porque todo ha ido bien
        sMessage = "La Empresa fue agregado exitosamente con el Codigo:   " & lPrimaryKey
        MsgBox sMessage, vbInformation, "Alta Fletero"
        Screen.MousePointer = vbDefault
        Exit Sub
ERR_cmdAltaRegistro:
    TableError Err
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Buscar" Then
On Error GoTo ERR_cmdBuscar:
     Screen.MousePointer = vbHourglass
     Items = 0: Criterio = ""
     For Items = Items + 1 To Text1.Count
        If Not Text1(Items - 1).Text = "" Then
            If Not Criterio = "" Then
                Criterio = Criterio & " AND "
            End If
            Select Case Text1(Items - 1).Index
                Case 0: Criterio = Criterio & "DescEmpresas Like '*" & Text1(0) & "*'"
                Case 1: Criterio = Criterio & "Direccion LIKE '*" & Text1(1) & "*'"
                Case 2: Criterio = Criterio & "CP LIKE '*" & Text1(2) & "*'"
                Case 3: Criterio = Criterio & "Localidad LIKE '*" & Text1(3) & "*'"
                Case 4: Criterio = Criterio & "Telefono LIKE '*" & Text1(4) & "*'"
                Case 5: Criterio = Criterio & "Email LIKE '*" & Text1(5) & "*'"
                Case 6: Criterio = Criterio & "CUIT LIKE '*" & Text1(6) & "*'"
            End Select
        End If
    Next
    If Not Criterio = "" Then
        SQL = "SELECT * FROM Empresas WHERE " & Criterio & ""
    Else
        SQL = "SELECT * FROM Empresas"
    End If
    Set rsEmpresas = db.OpenRecordset(SQL)
    Call MostrarRegistroEmpresas
    Modificar.Enabled = True: Aceptar.Enabled = False
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdBuscar:
    TableError Err
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Modificar" Then
On Error GoTo ERR_cmdModificar
    Screen.MousePointer = vbHourglass
    With rsEmpresas
        .Fields("DescEmpresas") = Text1(0)
        .Fields("Direccion") = Text1(1)
        .Fields("CP") = Text1(2)
        .Fields("Localidad") = Text1(3)
        .Fields("Telefono") = Text1(4)
        .Fields("Email") = Text1(5)
        .Fields("CUIT") = Text1(6)
        .Fields("CodIVA") = Combo1.ListIndex + 1
        .Update
        .LockEdits = False
    End With
    MsgBox "La Empresa ha sido Modificado Exitosamente", vbInformation, "Modificar Registro"
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &HFFFFFF
        Text1(Items - 1) = ""
    Next
    Combo1.BackColor = &HFFFFFF
    Combo1.ListIndex = 0
    Accion = "Nuevo"
    Items = 0
        For Items = Items + 1 To cmdMover.Count
             cmdMover(Items - 1).Visible = False
        Next
    Eliminar.Enabled = False: Buscar.Enabled = True: Aceptar.Enabled = True: Cancelar.Enabled = True
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdModificar:
    TableError Err
    Set rsEmpresas = Nothing
End If

End Sub

Private Sub AceptarProv_Click()
If Accion = "Nuevo" Then
On Error GoTo ERR_cmdAltaRegistro:
    Dim nAccessValue As Integer
    Screen.MousePointer = vbHourglass
    nAccessValue = 0
    ' aplica los permisos deseados por el usuario
    Set rsFleteros = db.OpenRecordset("Fleteros")
    
    Dim lPrimaryKey As Long
    Dim sMessage As String
    ' recupera una clave única desde la rutina GetPrimaryKey
    lPrimaryKey = CodigoProveedor
        With rsFleteros
            .AddNew
            .Fields("CodFlet") = lPrimaryKey
            .Fields("DescFlet") = Text2(0)
            .Fields("Direccion") = Text2(1)
            .Fields("Telefono") = Text2(4)
            .Fields("EMail") = Text2(6)
            .Fields("CUIT") = Text2(5)
            .Fields("CP") = Text2(2)
            .Fields("Localidad") = Text2(3)
            .Fields("CodIVA") = Combo2.ListIndex + 1
            .Fields("IIBB") = IIBB.ListIndex + 1
            .Update
        End With
        Set rsFleteros = Nothing
        Combo2.ListIndex = 0
        IIBB.ListIndex = 0
        Items = 0
        For Items = Items + 1 To Text2.Count
            Text2(Items - 1) = ""
        Next
        AceptarProv.Enabled = True: CancelarProv.Enabled = True: BuscarProv.Enabled = True: EliminaProv.Enabled = False
        Accion = "Nuevo"
        ' Si el código pasa por aquí es porque todo ha ido bien
        sMessage = "El Fletero fue agregado exitosamente con el Codigo:   " & lPrimaryKey
        MsgBox sMessage, vbInformation, "Alta Fletero"
        Screen.MousePointer = vbDefault
        Exit Sub
ERR_cmdAltaRegistro:
    TableError Err
    Set rsFleteros = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Buscar" Then
On Error GoTo ERR_cmdBuscar:
     Screen.MousePointer = vbHourglass
     Items = 0: Criterio = ""
     For Items = Items + 1 To Text2.Count
        If Not Text2(Items - 1).Text = "" And Items < 8 Then
            If Not Criterio = "" Then
                Criterio = Criterio & " AND "
            End If
            Select Case Text2(Items - 1).Index
                Case 0: Criterio = Criterio & "DescFlet Like '*" & Text2(0) & "*'"
                Case 1: Criterio = Criterio & "Direccion LIKE '*" & Text2(1) & "*'"
                Case 2: Criterio = Criterio & "CP LIKE '*" & Text2(2) & "*'"
                Case 3: Criterio = Criterio & "Localidad LIKE '*" & Text2(3) & "*'"
                Case 4: Criterio = Criterio & "Telefono LIKE '*" & Text2(4) & "*'"
                Case 5: Criterio = Criterio & "Email LIKE '*" & Text2(6) & "*'"
                Case 6: Criterio = Criterio & "CUIT LIKE '*" & Text2(5) & "*'"
            End Select
        End If
    Next
    If Not Criterio = "" Then
        SQL = "SELECT * FROM Fleteros WHERE " & Criterio & ""
    Else
        SQL = "SELECT * FROM Fleteros"
    End If
    Set rsFleteros = db.OpenRecordset(SQL)
    Call MostrarProv
    CambiaProv.Enabled = True: AceptarProv.Enabled = False
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdBuscar:
    TableError Err
    Set rsFleteros = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Modificar" Then
On Error GoTo ERR_cmdModificar
    Screen.MousePointer = vbHourglass
    With rsFleteros
        .Fields("DescFlet") = Text2(0)
        .Fields("Direccion") = Text2(1)
        .Fields("CP") = Text2(2)
        .Fields("Localidad") = Text2(3)
        .Fields("Telefono") = Text2(4)
        .Fields("Email") = Text2(6)
        .Fields("CUIT") = Text1(5)
        .Fields("CodIVA") = Combo2.ListIndex + 1
        .Fields("IIBB") = IIBB.ListIndex + 1
        .Update
        .LockEdits = False
    End With
    
    MsgBox "El Fletero ha sido Modificado Exitosamente", vbInformation, "Modificar Registro"
    Items = 0
    For Items = Items + 1 To Text2.Count
        Text2(Items - 1).BackColor = &HFFFFFF
        Text2(Items - 1) = ""
    Next
    Combo2.BackColor = &HFFFFFF
    Combo2.ListIndex = 0
    IIBB.ListIndex = 0
    IIBB.BackColor = &HFFFFFF
    Accion = "Nuevo"
    Items = 0
        For Items = Items + 1 To cmdMover1.Count
             cmdMover1(Items - 1).Visible = False
        Next
    EliminaProv.Enabled = False: BuscarProv.Enabled = True: AceptarProv.Enabled = True: CancelarProv.Enabled = True
    Set rsFleteros = Nothing
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdModificar:
    TableError Err
    Set rsFleteros = Nothing
End If

End Sub

Private Sub Buscar_Click()
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).BackColor = &H40C0&
Next
Combo1.BackColor = &H40C0&
Eliminar.Enabled = False: Modificar.Enabled = False: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True
Accion = "Buscar"
End Sub

Private Sub BuscarProv_Click()
Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1).BackColor = &H40C0&
Next
Combo2.BackColor = &H40C0&
IIBB.BackColor = &H40C0&

EliminaProv.Enabled = False: CambiaProv.Enabled = False: BuscarProv.Enabled = False: AceptarProv.Enabled = True: CancelarProv.Enabled = True
Accion = "Buscar"
End Sub

Private Sub CambiaProv_Click()
On Error GoTo ERR_cmdCambiar:
Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1).BackColor = &HFFFFFF
Next
Combo2.BackColor = &HFFFFFF
IIBB.BackColor = &HFFFFFF
EliminaProv.Enabled = False: CambiaProv.Enabled = False: BuscarProv.Enabled = False: AceptarProv.Enabled = True: CancelarProv.Enabled = True
rsFleteros.Edit
rsFleteros.LockEdits = True
Accion = "Modificar"
Exit Sub
ERR_cmdCambiar:
    TableError Err
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &H40C0&
    Next
    Combo1.BackColor = &H40C0&
    IIBB.BackColor = &H40C0&
    CtaCont.BackColor = &H40C0&
    EliminaProv.Enabled = False: CambiaProv.Enabled = True: BuscarProv.Enabled = False: AceptarProv.Enabled = True: CancelarProv.Enabled = True

End Sub

Private Sub Cancelar_Click()
Call EmpresasABM_Click
End Sub

Private Sub CancelarProv_Click()
ABMEmpresas.Visible = False
ABMProveedores.Visible = True
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo2.Clear
Do While Not rsSituacionIVA.EOF
    Combo2.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo2.ListIndex = 0
Combo2.BackColor = &H80000005
IIBB.Clear
IIBB.AddItem "Exento"
IIBB.AddItem "Agente de Retención"
IIBB.ListIndex = 0
IIBB.BackColor = &H80000005

Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1) = ""
    Text2(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover1.Count
    cmdMover1(Items - 1).Visible = False
Next
AceptarProv.Enabled = True: CancelarProv.Enabled = True: BuscarProv.Enabled = True: EliminaProv.Enabled = False: CambiaProv.Enabled = False
Accion = "Nuevo"

End Sub

Private Sub cmdMover_Click(Index As Integer)
' se definen las constantes para indicar el tipo de navegación
    ' cada constante se corresponde con un índice de la matriz de
    ' controles
    Const MOVE_FIRST = 0
    Const MOVE_PREVIOUS = 1
    Const MOVE_NEXT = 2
    Const MOVE_LAST = 3
    With rsEmpresas
        Select Case Index
            ' se mueve al primer registro
            Case MOVE_FIRST:
                .MoveFirst
            ' se mueve al registro anterior, si llega al inicio
            ' del recordset, se mueve al primer registro
            Case MOVE_PREVIOUS:
                .MovePrevious
                If (.BOF) Then .MoveFirst
            ' se mueve al registro siguiente, si llega al final
            ' del recordset, se mueve al último registro
            Case MOVE_NEXT:
                .MoveNext
                If (.EOF) Then .MoveLast
            ' se mueve al último registro
            Case MOVE_LAST:
                .MoveLast
        End Select
    End With
    ' visualiza el registro
    MostrarRegistroEmpresas
End Sub

Private Sub cmdMover1_Click(Index As Integer)
 ' se definen las constantes para indicar el tipo de navegación
    ' cada constante se corresponde con un índice de la matriz de
    ' controles
    Const MOVE_FIRST = 0
    Const MOVE_PREVIOUS = 1
    Const MOVE_NEXT = 2
    Const MOVE_LAST = 3
    With rsFleteros
        Select Case Index
            ' se mueve al primer registro
            Case MOVE_FIRST:
                .MoveFirst
            ' se mueve al registro anterior, si llega al inicio
            ' del recordset, se mueve al primer registro
            Case MOVE_PREVIOUS:
                .MovePrevious
                If (.BOF) Then .MoveFirst
            ' se mueve al registro siguiente, si llega al final
            ' del recordset, se mueve al último registro
            Case MOVE_NEXT:
                .MoveNext
                If (.EOF) Then .MoveLast
            ' se mueve al último registro
            Case MOVE_LAST:
                .MoveLast
        End Select
    End With
    ' visualiza el registro
    MostrarProv

End Sub

Private Sub Command1_Click()
Dim VSaldo As Double
Dim VsaldoInicial As Double
Dim VFDesde As Date
If FDesde.Text = "__/__/____" Or FHasta = "__/__/____" Then
    MsgBox "Debe ingresar fecha de consulta"
    Exit Sub
End If
If Text1 = "" Then
    MsgBox "Debe Ingresar un Fletero", vbInformation
    Exit Sub
End If
If Format(FDesde, "mm/dd/yyyy") > Format(FHasta, "mm/dd/yyyy") Then
    MsgBox "Fecha Desde No puede ser mayor que Fecha Hasta", vbInformation
    Exit Sub
End If
VFDesde = FDesde
VSaldo = 0
VsaldoInicial = 0
'CALCULA SALDO INICIAL
CtaCte.ListItems.Clear
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE Fecha < #" & Format(FDesde, "mm/dd/yyyy") & "# AND CodEmp = " & Text6(0) & "")
Do While Not rsCtaCteEmp.EOF
    If Not rsCtaCteEmp!Debe = "" Then
        VFDesde = rsCtaCteEmp!Fecha
        VsaldoInicial = VsaldoInicial + rsCtaCteEmp!Debe
    End If
    If Not rsCtaCteEmp!HABER = "" Then
        VsaldoInicial = VsaldoInicial - rsCtaCteEmp!HABER
    End If
    rsCtaCteEmp.MoveNext
Loop
Set Lista = CtaCte.ListItems.Add(, , "")
Lista.SubItems(2) = "Saldo Inicial"
Lista.SubItems(6) = FormatNumber(VsaldoInicial)
Set rsCtaCteProv = Nothing
'BUSCA DETALLE DEL MAYOR
Set rsCtaCteEmp = db.OpenRecordset("SELECT * FROM CtaCteEmp WHERE CodEmp = " & Text6(0) & " AND Fecha BETWEEN # " + Format(FDesde, "mm/dd/yyyy") + " # AND # " + Format(FHasta, "mm/dd/yyyy") + " # ORDER BY Fecha")
VSaldo = VsaldoInicial
Do While Not rsCtaCteEmp.EOF
    Set Lista = CtaCte.ListItems.Add(, , rsCtaCteEmp!Fecha)
    Lista.Tag = rsCtaCteEmp!Fecha
    Lista.SubItems(1) = rsCtaCteEmp!TipoComp
    Set rsComprobantes = db.OpenRecordset("SELECT * FROM Comprobantes WHERE CodComp = " & rsCtaCteEmp!TipoComp & "")
    Lista.SubItems(2) = rsComprobantes!DescComp
    Set rsComprobantes = Nothing
    vtamaño = Len(rsCtaCteEmp!PtoVta)
    Select Case vtamaño
        Case 1: vptovta = "000" & rsCtaCteEmp!PtoVta
        Case 2: vptovta = "00" & rsCtaCteEmp!PtoVta
        Case 3: vptovta = "0" & rsCtaCteEmp!PtoVta
        Case 4: vptovta = rsCtaCteEmp!PtoVta
    End Select
    vtamaño = Len(rsCtaCteEmp!NroComp)
    Select Case vtamaño
        Case 1: VNroFact = "0000000" & rsCtaCteEmp!NroComp
        Case 2: VNroFact = "000000" & rsCtaCteEmp!NroComp
        Case 3: VNroFact = "00000" & rsCtaCteEmp!NroComp
        Case 4: VNroFact = "0000" & rsCtaCteEmp!NroComp
        Case 5: VNroFact = "000" & rsCtaCteEmp!NroComp
        Case 6: VNroFact = "00" & rsCtaCteEmp!NroComp
        Case 7: VNroFact = "0" & rsCtaCteEmp!NroComp
        Case 8: VNroFact = rsCtaCteEmp!NroComp
    End Select
    vdesccomp = vptovta & "-" & VNroFact
    Lista.SubItems(3) = vdesccomp
    If Not rsCtaCteEmp!Debe = "" Then
        Lista.SubItems(4) = FormatNumber(rsCtaCteEmp!Debe)
        VSaldo = VSaldo + rsCtaCteEmp!Debe
    End If
    If Not rsCtaCteEmp!HABER = "" Then
        Lista.SubItems(5) = FormatNumber(rsCtaCteEmp!HABER)
        VSaldo = VSaldo - rsCtaCteEmp!HABER
    End If
    Lista.SubItems(6) = FormatNumber(VSaldo)
    Lista.SubItems(7) = FormatNumber(rsCtaCteEmp!SaldoComp)
    rsCtaCteEmp.MoveNext
Loop

End Sub

Private Sub ConsCtaCte_Click()
ABMEmpresas.Visible = False
ABMProveedores.Visible = False
Facturar.Visible = False
FCtaCte.Visible = True
i = 0
For i = i + 1 To Text6.Count
    Text6(i - 1) = ""
Next
CtaCte.ListItems.Clear
End Sub

Private Sub EmpresasABM_Click()
ABMEmpresas.Visible = True
ABMProveedores.Visible = False
Facturar.Visible = False
FCtaCte.Visible = False
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo1.Clear
Do While Not rsSituacionIVA.EOF
    Combo1.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo1.ListIndex = 0
Combo1.BackColor = &H80000005
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1) = ""
    Text1(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover.Count
    cmdMover(Items - 1).Visible = False
Next
Aceptar.Enabled = True: Cancelar.Enabled = True: Buscar.Enabled = True: Eliminar.Enabled = False: Modificar.Enabled = False
Accion = "Nuevo"
End Sub

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

Private Sub FacturarViajes_Click()
ABMEmpresas.Visible = False
ABMProveedores.Visible = False
Facturar.Visible = True
FCtaCte.Visible = False
LDetFact.ListItems.Clear
TNetoFact = 0: TIVAFact = 0: TFact = 0
Items = 0
For Items = Items + 1 To Text3.Count
    If Items = 10 Or Items = 11 Or Items = 12 Then
        Text3(9) = "0.00": Text3(10) = "0.00": Text3(11) = "0.00"
    Else
        Text3(Items - 1) = ""
    End If
Next
Items = 0
For Items = Items + 1 To Text4.Count
    Text4(Items - 1) = "0.00"
Next
FViaje.Mask = ""
FViaje.Text = ""
FViaje.Mask = "##/##/####"
FFact.Mask = ""
FFact.Text = ""
FFact.Mask = "##/##/####"
Text3(0).SetFocus
End Sub

Private Sub FFact_LostFocus()
If IsDate(FFact) = False Then
    MsgBox "Fecha Incorrecta", vbInformation
    FFact.SetFocus
End If
End Sub

Private Sub Form_Load()
'configura la configuracion regional
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SDECIMAL, ".")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SLIST, ",")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SMONDECIMALSEP, ".")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_SMONTHOUSANDSEP, ",")
    Call SetLocaleInfo(GetSystemDefaultLCID(), LOCALE_STHOUSAND, ",")
Dim sDBName As String, sDBNameTemp As String
    ' obtiene la ruta de acceso y el nombre de la base de datos usada en
    ' el proyecto por medio del mçodulo ReadINI
    sDBName = DBPath
    sDBNameTemp = DBPathTemp
    
    ' abre la base de datos y el recordset
    Set db = DBEngine.Workspaces(0).OpenDatabase(sDBName)
    Set dbTemp = DBEngine.Workspaces(0).OpenDatabase(sDBNameTemp)


End Sub


Private Sub FViaje_LostFocus()
If IsDate(FFact) = True Then
If IsDate(FViaje) = False Then
    'MsgBox "Fecha Incorrecta", vbInformation
    'FViaje.SetFocus
End If
End If
End Sub

Private Sub GrabarFact_Click()
Dim VNroFact As Long
If TFact = 0 Then
    MsgBox "Debe cagar los viajes", vbInformation
    Exit Sub
End If
If Text3(0) = "" Then
    MsgBox "Debe Seleccionar una Empresa", vbInformation
    Text3(0).SetFocus: Exit Sub
End If
Set rsEncabFact = db.OpenRecordset("EncabFact")
rsEncabFact.MoveLast
VNroFact = rsEncabFact!NroFact + 1
With rsEncabFact
    .AddNew
    .Fields("NroFact") = VNroFact
    .Fields("Fecha") = FFact
    .Fields("Codigo") = Text3(0)
    .Fields("TipoFact") = 1
    .Fields("TNeto") = FormatNumber(TNetoFact)
    .Fields("TIVA") = FormatNumber(TIVAFact)
    .Fields("TGral") = FormatNumber(TFact)
    .Update
End With
Set rsEncabFact = Nothing
Set rsDetFact = db.OpenRecordset("DetFact")
Items = 0
For Items = Items + 1 To LDetFact.ListItems.Count
    Set Lista = LDetFact.ListItems.Item(Items)
    With rsDetFact
        .AddNew
        .Fields("NroFact") = VNroFact
        .Fields("FechaViaje") = Lista.Tag
        .Fields("NroRem") = Lista.SubItems(1)
        .Fields("Mercaderia") = Lista.SubItems(2)
        .Fields("Procedencia") = Lista.SubItems(3)
        .Fields("Destino") = Lista.SubItems(4)
        .Fields("Kilos") = Lista.SubItems(5)
        .Fields("Tarifa") = Lista.SubItems(6)
        .Fields("STotal") = Lista.SubItems(7)
        .Update
    End With
Next
Set rsDetFact = Nothing
Set rsCtaCteEmp = db.OpenRecordset("CtaCteEmp")
With rsCtaCteEmp
    .AddNew
    .Fields("Fecha") = FFact
    .Fields("CodEmp") = Text3(0)
    .Fields("PtoVta") = 1
    .Fields("NroComp") = VNroFact
    .Fields("Debe") = FormatNumber(TFact)
    .Fields("SaldoComp") = FormatNumber(TFact)
    .Update
End With
Set rsCtaCteEmp = Nothing
Call FacturarViajes_Click
MsgBox "Grabado Correctamente"
Call Imprime_Fact(VNroFact)
End Sub



Private Sub ListEmpresas_DblClick()
Set LEmpresas = ListEmpresas.ListItems.Item(ListEmpresas.SelectedItem.Index)
    Set rsEmpresas = db.OpenRecordset("Select * From Empresas Where CodEmpresas = " & LEmpresas.Tag & "")
    If Viene = "Factura" Then
        If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
            Text3(0) = rsEmpresas!CodEmpresas
            Text3(1) = rsEmpresas!DescEmpresas
            Text3(2) = rsEmpresas!Direccion
            Text3(3) = rsEmpresas!Localidad
            Text3(4) = rsEmpresas!CUIT
            FFact.SetFocus
            Viene = ""
            BuscaEmpresas.Visible = False
        End If
    End If
End Sub

Private Sub Modificar_Click()
On Error GoTo ERR_cmdCambiar:
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).BackColor = &HFFFFFF
Next
Combo1.BackColor = &HFFFFFF
Eliminar.Enabled = False: Modificar.Enabled = False: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True
rsEmpresas.Edit
rsEmpresas.LockEdits = True
Accion = "Modificar"
Exit Sub
ERR_cmdCambiar:
    TableError Err
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &H40C0&
    Next
    Combo1.BackColor = &H40C0&
    Eliminar.Enabled = False: Modificar.Enabled = True: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True

End Sub

Private Sub ProveedoresABM_Click()
ABMEmpresas.Visible = False
ABMProveedores.Visible = True
Facturar.Visible = False
FCtaCte.Visible = False
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo2.Clear
Do While Not rsSituacionIVA.EOF
    Combo2.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo2.ListIndex = 0
Combo2.BackColor = &H80000005
IIBB.Clear
IIBB.AddItem "Exento"
IIBB.AddItem "Agente de Retención"
IIBB.ListIndex = 0
IIBB.BackColor = &H80000005

Items = 0
For Items = Items + 1 To Text2.Count
    Text2(Items - 1) = ""
    Text2(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover1.Count
    cmdMover1(Items - 1).Visible = False
Next
AceptarProv.Enabled = True: CancelarProv.Enabled = True: BuscarProv.Enabled = True: EliminaProv.Enabled = False: CambiaProv.Enabled = False
Accion = "Nuevo"

End Sub

Private Sub Text3_Change(Index As Integer)
Select Case Index
Case 9:
    If IsNumeric(Text3(9)) = False Then
            MsgBox "El campo debe ser numerico"
            Text3(9).SetFocus
        Else
            Text3(11) = FormatNumber((Val(Text3(9)) * Val(Text3(10))) / 1000)
        End If
 Case 10:
        If IsNumeric(Text3(10)) = False Then
            MsgBox "El campo debe ser numerico"
            Text3(10).SetFocus
        Else
            Text3(11) = FormatNumber((Val(Text3(9)) * Val(Text3(10))) / 1000)
        End If
End Select
End Sub

Private Sub Text3_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Not Text3(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas Where CodEmpresas = " & Text3(0) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text3(1) = rsEmpresas.Fields("DescEmpresas")
                Text3(2) = rsEmpresas.Fields("Direccion")
                Text3(3) = rsEmpresas.Fields("Localidad")
                Text3(4) = rsEmpresas.Fields("CUIT")
                FFact.SetFocus
            Else
                MsgBox "La empresa no existe", vbInformation
            End If
        Else
            BuscaEmpresas.Visible = True
            Viene = "Factura"
            Set rsEmpresas = db.OpenRecordset("Empresas")
            Do While Not rsEmpresas.EOF
                Set LEmpresas = ListEmpresas.ListItems.Add(, , rsEmpresas!CodEmpresas)
                    LEmpresas.Tag = rsEmpresas!CodEmpresas
                    LEmpresas.SubItems(1) = rsEmpresas!DescEmpresas
                    rsEmpresas.MoveNext
            Loop
            Text5.SetFocus
            Text5 = ""
        End If
    Case 9:
        If IsNumeric(Text3(9)) = False Then
            MsgBox "El campo debe ser numerico"
            Text3(9).SetFocus
        End If
    Case 11:
        If Not Text3(5) = "" And Not Text3(6) = "" And Not Text3(7) = "" And Not Text3(8) = "" And Not Text3(9) = "" And Not Text3(10) = "" Then
            Set Lista = LDetFact.ListItems.Add(, , FViaje)
            Lista.Tag = FViaje
            Lista.SubItems(1) = Text3(5)
            Lista.SubItems(2) = Text3(6)
            Lista.SubItems(3) = Text3(7)
            Lista.SubItems(4) = Text3(8)
            Lista.SubItems(5) = Text3(9)
            Lista.SubItems(6) = Text3(10)
            Lista.SubItems(7) = Text3(11)
            TNetoFact = TNetoFact + Text3(11)
            TIVAFact = TNetoFact * 21 / 100
            TFact = TNetoFact + TIVAFact
            Text4(0) = FormatNumber(TNetoFact)
            Text4(1) = FormatNumber(TIVAFact)
            Text4(2) = FormatNumber(TFact)
            FViaje.Mask = "": FViaje.Text = "": FViaje.Mask = "##/##/####"
            Text3(5) = "": Text3(6) = "": Text3(7) = "": Text3(8) = "": Text3(9) = "0.00": Text3(10) = "0.00": Text3(11) = "0.00"
            FViaje.SetFocus
        Else
            MsgBox "Faltan datos obligatorios del viaje", vbInformation
        End If
End Select
        
    
End Sub

Private Sub Text6_LostFocus(Index As Integer)
Select Case Index
    Case 0:
        If Not Text6(0) = "" Then
            Set rsEmpresas = db.OpenRecordset("SELECT * FROM Empresas Where CodEmpresas = " & Text3(0) & "")
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text6(1) = rsEmpresas.Fields("DescEmpresas")
                FDesde.SetFocus
            Else
                MsgBox "La empresa no existe", vbInformation
            End If
        Else
            BuscaEmpresas.Visible = True
            FCtaCte.ZOrder 0
            BuscaEmpresas.ZOrder 1
            Viene = "CtaCte"
            Set rsEmpresas = db.OpenRecordset("Empresas")
            Do While Not rsEmpresas.EOF
                Set LEmpresas = ListEmpresas.ListItems.Add(, , rsEmpresas!CodEmpresas)
                    LEmpresas.Tag = rsEmpresas!CodEmpresas
                    LEmpresas.SubItems(1) = rsEmpresas!DescEmpresas
                    rsEmpresas.MoveNext
            Loop
            Text5.SetFocus
            Text5 = ""
        End If
End Select
End Sub
