VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form Liquidaciones 
   BackColor       =   &H80000007&
   Caption         =   "Liquidaciones"
   ClientHeight    =   8235
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   12375
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   8235
   ScaleWidth      =   12375
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   31
      Left            =   5400
      TabIndex        =   84
      Text            =   "Text1"
      Top             =   1080
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   30
      Left            =   1680
      TabIndex        =   82
      Text            =   "Text1"
      Top             =   1080
      Width           =   2055
   End
   Begin VB.TextBox Text1 
      Alignment       =   1  'Right Justify
      Height          =   285
      Index           =   28
      Left            =   2280
      TabIndex        =   77
      Text            =   "Text1"
      Top             =   6600
      Visible         =   0   'False
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   1680
      TabIndex        =   3
      Text            =   "Text1"
      Top             =   600
      Width           =   6135
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2640
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   120
      Width           =   5175
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1680
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   120
      Width           =   855
   End
   Begin KewlButtonz.KewlButtons CargarViajes 
      Height          =   735
      Left            =   240
      TabIndex        =   4
      Top             =   7200
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Cargar Viajes"
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
      MICON           =   "Liquidaciones.frx":0000
      PICN            =   "Liquidaciones.frx":001C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons CargarDesc 
      Height          =   735
      Left            =   3720
      TabIndex        =   18
      Top             =   7200
      Width           =   1935
      _ExtentX        =   3413
      _ExtentY        =   1296
      BTYPE           =   1
      TX              =   "Descuenrtos"
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
      MICON           =   "Liquidaciones.frx":0493
      PICN            =   "Liquidaciones.frx":04AF
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
      Left            =   6720
      TabIndex        =   47
      Top             =   7200
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
      MICON           =   "Liquidaciones.frx":07C9
      PICN            =   "Liquidaciones.frx":07E5
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
      Left            =   9600
      TabIndex        =   48
      Top             =   7200
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
      MICON           =   "Liquidaciones.frx":2867
      PICN            =   "Liquidaciones.frx":2883
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin MSMask.MaskEdBox Fecha 
      Height          =   255
      Index           =   0
      Left            =   8640
      TabIndex        =   2
      Top             =   120
      Width           =   1695
      _ExtentX        =   2990
      _ExtentY        =   450
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin KewlButtonz.KewlButtons Buscar 
      Height          =   495
      Left            =   8040
      TabIndex        =   76
      Top             =   480
      Width           =   2295
      _ExtentX        =   4048
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Buscar Liquidacion"
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
      MICON           =   "Liquidaciones.frx":2E1D
      PICN            =   "Liquidaciones.frx":2E39
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Frame DetLiq 
      BackColor       =   &H80000007&
      Caption         =   "Detalle Liqudación"
      ForeColor       =   &H000040C0&
      Height          =   5295
      Left            =   120
      TabIndex        =   21
      Top             =   1560
      Width           =   8175
      Begin VB.Frame Frame4 
         BackColor       =   &H00000000&
         Caption         =   "Resumen"
         ForeColor       =   &H000040C0&
         Height          =   2655
         Left            =   240
         TabIndex        =   31
         Top             =   2520
         Width           =   7695
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            BeginProperty Font 
               Name            =   "MS Sans Serif"
               Size            =   8.25
               Charset         =   0
               Weight          =   700
               Underline       =   0   'False
               Italic          =   0   'False
               Strikethrough   =   0   'False
            EndProperty
            ForeColor       =   &H00FF0000&
            Height          =   285
            Index           =   13
            Left            =   3600
            TabIndex        =   46
            Text            =   "Text1"
            Top             =   1920
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   12
            Left            =   3600
            TabIndex        =   45
            Text            =   "Text1"
            Top             =   1080
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   11
            Left            =   3600
            TabIndex        =   44
            Text            =   "Text1"
            Top             =   720
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   10
            Left            =   3600
            TabIndex        =   43
            Text            =   "Text1"
            Top             =   360
            Width           =   1695
         End
         Begin VB.Line Line3 
            BorderColor     =   &H000040C0&
            BorderWidth     =   2
            X1              =   3480
            X2              =   5415
            Y1              =   1800
            Y2              =   1815
         End
         Begin VB.Label Label13 
            BackColor       =   &H00000000&
            Caption         =   "Total a Pagar"
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
            Left            =   1080
            TabIndex        =   35
            Top             =   1920
            Width           =   2055
         End
         Begin VB.Label Label12 
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
            Index           =   0
            Left            =   1080
            TabIndex        =   34
            Top             =   1080
            Width           =   2055
         End
         Begin VB.Label Label6 
            BackColor       =   &H00000000&
            Caption         =   "Total Comisiones "
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
            Left            =   1080
            TabIndex        =   33
            Top             =   720
            Width           =   1455
         End
         Begin VB.Label Label5 
            BackColor       =   &H00000000&
            Caption         =   "Total Viajes Realizados"
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
            Left            =   1080
            TabIndex        =   32
            Top             =   360
            Width           =   2775
         End
      End
      Begin VB.Frame Frame3 
         BackColor       =   &H00000000&
         Caption         =   "Comisiones"
         ForeColor       =   &H000040C0&
         Height          =   2055
         Left            =   3840
         TabIndex        =   26
         Top             =   360
         Width           =   4095
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   9
            Left            =   2280
            TabIndex        =   42
            Text            =   "Text1"
            Top             =   1680
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   8
            Left            =   2280
            TabIndex        =   41
            Text            =   "Text1"
            Top             =   1080
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   7
            Left            =   2280
            TabIndex        =   40
            Text            =   "Text1"
            Top             =   720
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   6
            Left            =   2280
            TabIndex        =   39
            Text            =   "Text1"
            Top             =   360
            Width           =   1695
         End
         Begin VB.Line Line2 
            BorderColor     =   &H000040C0&
            BorderWidth     =   2
            X1              =   2160
            X2              =   4095
            Y1              =   1440
            Y2              =   1455
         End
         Begin VB.Label Label11 
            BackColor       =   &H00000000&
            Caption         =   "Total Comision"
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
            TabIndex        =   30
            Top             =   1680
            Width           =   1815
         End
         Begin VB.Label Label10 
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
            Left            =   240
            TabIndex        =   29
            Top             =   1080
            Width           =   1815
         End
         Begin VB.Label Label9 
            BackColor       =   &H00000000&
            Caption         =   "Comision Neta"
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
            TabIndex        =   28
            Top             =   720
            Width           =   1815
         End
         Begin VB.Label Label2 
            BackColor       =   &H00000000&
            Caption         =   "Porcentaje Comision"
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
            TabIndex        =   27
            Top             =   360
            Width           =   1815
         End
      End
      Begin VB.Frame Frame2 
         BackColor       =   &H00000000&
         Caption         =   "Viajes Realizados"
         ForeColor       =   &H000040C0&
         Height          =   2055
         Left            =   240
         TabIndex        =   22
         Top             =   360
         Width           =   3375
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   29
            Left            =   1440
            TabIndex        =   79
            Text            =   "Text1"
            Top             =   1080
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   5
            Left            =   1440
            TabIndex        =   38
            Text            =   "Text1"
            Top             =   1680
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   4
            Left            =   1440
            TabIndex        =   37
            Text            =   "Text1"
            Top             =   720
            Width           =   1695
         End
         Begin VB.TextBox Text1 
            Alignment       =   1  'Right Justify
            Height          =   285
            Index           =   3
            Left            =   1440
            TabIndex        =   36
            Text            =   "Text1"
            Top             =   360
            Width           =   1695
         End
         Begin VB.Label Label12 
            BackColor       =   &H00000000&
            Caption         =   "Retencion IIBB"
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
            Left            =   120
            TabIndex        =   80
            Top             =   1080
            Width           =   1335
         End
         Begin VB.Line Line1 
            BorderColor     =   &H000040C0&
            BorderWidth     =   2
            X1              =   1320
            X2              =   3255
            Y1              =   1560
            Y2              =   1575
         End
         Begin VB.Label Label8 
            BackColor       =   &H00000000&
            Caption         =   "Total Viajes"
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
            TabIndex        =   25
            Top             =   1680
            Width           =   1455
         End
         Begin VB.Label Label7 
            BackColor       =   &H00000000&
            Caption         =   "IVA "
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
            TabIndex        =   24
            Top             =   720
            Width           =   1455
         End
         Begin VB.Label Label4 
            BackColor       =   &H00000000&
            Caption         =   "Neto Viajes"
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
            TabIndex        =   23
            Top             =   360
            Width           =   1455
         End
      End
   End
   Begin VB.Frame Descuentos 
      BackColor       =   &H00000000&
      Caption         =   "Descuentos"
      ForeColor       =   &H000040C0&
      Height          =   4215
      Left            =   120
      TabIndex        =   63
      Top             =   1680
      Width           =   11895
      Begin MSComctlLib.ListView DescPendientes 
         Height          =   1335
         Left            =   4560
         TabIndex        =   87
         Top             =   600
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
         Height          =   1815
         Left            =   120
         TabIndex        =   74
         Top             =   2040
         Width           =   8775
         _ExtentX        =   15478
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
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   27
         Left            =   1800
         TabIndex        =   71
         Text            =   "Text1"
         Top             =   1560
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   26
         Left            =   1800
         TabIndex        =   70
         Text            =   "Text1"
         Top             =   1200
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   25
         Left            =   1800
         TabIndex        =   69
         Text            =   "Text1"
         Top             =   840
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   24
         Left            =   1200
         TabIndex        =   68
         Text            =   "Text1"
         Top             =   360
         Width           =   1455
      End
      Begin KewlButtonz.KewlButtons AgregarDesc 
         Height          =   375
         Left            =   9360
         TabIndex        =   72
         Top             =   480
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
         MICON           =   "Liquidaciones.frx":4B43
         PICN            =   "Liquidaciones.frx":4B5F
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
         Left            =   9360
         TabIndex        =   73
         Top             =   840
         Width           =   2415
         _ExtentX        =   4260
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
         MICON           =   "Liquidaciones.frx":6BE1
         PICN            =   "Liquidaciones.frx":6BFD
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
         TabIndex        =   75
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
         MICON           =   "Liquidaciones.frx":7197
         PICN            =   "Liquidaciones.frx":71B3
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label24 
         BackColor       =   &H00000000&
         Caption         =   "Facturas Pendientes"
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
         Left            =   5640
         TabIndex        =   86
         Top             =   240
         Width           =   2415
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
         Left            =   120
         TabIndex        =   67
         Top             =   1560
         Width           =   1215
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
         TabIndex        =   66
         Top             =   1200
         Width           =   1575
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
         TabIndex        =   65
         Top             =   840
         Width           =   1455
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
         TabIndex        =   64
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.Frame Viajes 
      BackColor       =   &H00000000&
      Caption         =   "Cargas Viajes"
      ForeColor       =   &H000040C0&
      Height          =   5295
      Left            =   0
      TabIndex        =   49
      Top             =   1680
      Width           =   12015
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   32
         Left            =   6120
         TabIndex        =   85
         Text            =   "Text1"
         Top             =   1440
         Visible         =   0   'False
         Width           =   1455
      End
      Begin VB.ComboBox Provincia 
         Height          =   315
         Left            =   9960
         TabIndex        =   14
         Text            =   "Combo1"
         Top             =   1080
         Width           =   1935
      End
      Begin MSComctlLib.ListView ListaViajes 
         Height          =   2535
         Left            =   120
         TabIndex        =   61
         Top             =   1920
         Width           =   11700
         _ExtentX        =   20638
         _ExtentY        =   4471
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
         NumItems        =   15
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Fecha"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Nro Rem"
            Object.Width           =   1411
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "Empresa"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Chofer"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Mercaderia"
            Object.Width           =   2117
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Procedencia"
            Object.Width           =   2117
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Destino"
            Object.Width           =   2117
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Kilos"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(9) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   8
            Text            =   "Tarifa"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(10) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   9
            Text            =   "SubTotal"
            Object.Width           =   1764
         EndProperty
         BeginProperty ColumnHeader(11) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   10
            Text            =   "CodEmpresa"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(12) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   11
            Text            =   "CodChofer"
            Object.Width           =   353
         EndProperty
         BeginProperty ColumnHeader(13) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   12
            Text            =   "Prov"
            Object.Width           =   176
         EndProperty
         BeginProperty ColumnHeader(14) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   13
            Text            =   "NroViaje"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(15) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   14
            Text            =   "Facturado"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   23
         Left            =   4080
         TabIndex        =   16
         Text            =   "Text1"
         Top             =   1440
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Alignment       =   1  'Right Justify
         Height          =   285
         Index           =   22
         Left            =   1320
         TabIndex        =   15
         Text            =   "Text1"
         Top             =   1440
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   21
         Left            =   6840
         TabIndex        =   13
         Text            =   "Text1"
         Top             =   1080
         Width           =   1935
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   20
         Left            =   4080
         TabIndex        =   12
         Text            =   "Text1"
         Top             =   1080
         Width           =   1935
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   19
         Left            =   1320
         TabIndex        =   11
         Text            =   "Text1"
         Top             =   1080
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   18
         Left            =   4440
         TabIndex        =   10
         Text            =   "Text1"
         Top             =   720
         Width           =   3615
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   17
         Left            =   3840
         TabIndex        =   9
         Text            =   "Text1"
         Top             =   720
         Width           =   495
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   16
         Left            =   1320
         TabIndex        =   8
         Text            =   "Text1"
         Top             =   720
         Width           =   1455
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   15
         Left            =   4440
         TabIndex        =   7
         Text            =   "Text1"
         Top             =   360
         Width           =   3615
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   14
         Left            =   3840
         TabIndex        =   6
         Text            =   "Text1"
         Top             =   360
         Width           =   495
      End
      Begin KewlButtonz.KewlButtons AgregarViaje 
         Height          =   375
         Left            =   8280
         TabIndex        =   17
         Top             =   240
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
         MICON           =   "Liquidaciones.frx":74CD
         PICN            =   "Liquidaciones.frx":74E9
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
         Left            =   8280
         TabIndex        =   59
         Top             =   600
         Width           =   2415
         _ExtentX        =   4260
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
         MICON           =   "Liquidaciones.frx":956B
         PICN            =   "Liquidaciones.frx":9587
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin MSMask.MaskEdBox Fecha 
         Height          =   255
         Index           =   1
         Left            =   1320
         TabIndex        =   5
         Top             =   360
         Width           =   1455
         _ExtentX        =   2566
         _ExtentY        =   450
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin KewlButtonz.KewlButtons Volver 
         Height          =   375
         Left            =   4920
         TabIndex        =   62
         Top             =   4560
         Width           =   3015
         _ExtentX        =   5318
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Volver al Resumen"
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
         MICON           =   "Liquidaciones.frx":9B21
         PICN            =   "Liquidaciones.frx":9B3D
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label28 
         BackColor       =   &H00000000&
         Caption         =   "Proviancia"
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
         Left            =   8880
         TabIndex        =   78
         Top             =   1080
         Width           =   1215
      End
      Begin VB.Label Label22 
         BackColor       =   &H00000000&
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
         Left            =   2880
         TabIndex        =   58
         Top             =   1440
         Width           =   1095
      End
      Begin VB.Label Label21 
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
         Left            =   240
         TabIndex        =   57
         Top             =   1440
         Width           =   1095
      End
      Begin VB.Label Label20 
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
         Left            =   6120
         TabIndex        =   56
         Top             =   1080
         Width           =   1095
      End
      Begin VB.Label Label19 
         BackColor       =   &H00000000&
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
         Left            =   2880
         TabIndex        =   55
         Top             =   1080
         Width           =   1095
      End
      Begin VB.Label Label18 
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
         Left            =   240
         TabIndex        =   54
         Top             =   1080
         Width           =   1095
      End
      Begin VB.Label Label17 
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
         Left            =   2880
         TabIndex        =   53
         Top             =   720
         Width           =   1095
      End
      Begin VB.Label Label16 
         BackColor       =   &H00000000&
         Caption         =   "Nro Remito"
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
         TabIndex        =   52
         Top             =   720
         Width           =   1095
      End
      Begin VB.Label Label15 
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
         Left            =   2880
         TabIndex        =   51
         Top             =   360
         Width           =   1095
      End
      Begin VB.Label Label14 
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
         Left            =   240
         TabIndex        =   50
         Top             =   360
         Width           =   1095
      End
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
      Caption         =   "Porcentaje IIBB: "
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
      Left            =   3840
      TabIndex        =   83
      Top             =   1080
      Width           =   1455
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
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
      Height          =   255
      Index           =   1
      Left            =   120
      TabIndex        =   81
      Top             =   1080
      Width           =   1455
   End
   Begin VB.Label Label23 
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
      Left            =   7920
      TabIndex        =   60
      Top             =   120
      Width           =   1455
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
      Caption         =   "Obsevaciones"
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
      TabIndex        =   20
      Top             =   600
      Width           =   1455
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
      Left            =   120
      TabIndex        =   19
      Top             =   120
      Width           =   1455
   End
End
Attribute VB_Name = "Liquidaciones"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private Error As Boolean, OPBUSCAR As String
Dim LDescGO As ListItem

Private Sub Aceptar_Click()
On Error GoTo ERR_cmdGrabarLiq
Dim sMessage As String
If Accion = "Nuevo" Then
    Set TrsEncabLiq = dbTemp.OpenRecordset("EncabLiquidacion")
    Set TrsLiqDetViajes = dbTemp.OpenRecordset("LiqDetViajes")
    Set TrsLiqDetDesc = dbTemp.OpenRecordset("LiqDetDescuentos")
    'limpia temporales
    Do While Not TrsEncabLiq.EOF
        TrsEncabLiq.Delete
        TrsEncabLiq.MoveNext
    Loop
    Do While Not TrsLiqDetViajes.EOF
        TrsLiqDetViajes.Delete
        TrsLiqDetViajes.MoveNext
    Loop
    Do While Not TrsLiqDetDesc.EOF
        TrsLiqDetDesc.Delete
        TrsLiqDetDesc.MoveNext
    Loop

    Set rsEncabLiq = db.OpenRecordset("EncabLiquidacion")
    Set rsLiqDetViajes = db.OpenRecordset("LiqDetViajes")
    Set rsLiqDetDesc = db.OpenRecordset("LiqDetDescuentos")
    Set rsViajesFact = db.OpenRecordset("ViajesFactura")
    'graba encabezado liquidacion
    ' recupera una clave única desde la rutina GetPrimaryKey
    rsEncabLiq.Index = "PrimaryKey"
    rsEncabLiq.MoveLast
    lPrimaryKey = rsEncabLiq!NroLiq + 1
    If Not lPrimaryKey = 0 Then
        With rsEncabLiq
            .AddNew
            .Fields("NroLiq") = lPrimaryKey
            .Fields("CodFlet") = Text1(0)
            .Fields("Fecha") = Fecha(0)
            .Fields("Obs") = Text1(2)
            .Fields("TNetoViajes") = Text1(3)
            .Fields("TIVAViajes") = Text1(4)
            .Fields("TViajes") = Text1(5)
            .Fields("TNetoComis") = Text1(7)
            .Fields("TIVAComis") = Text1(8)
            .Fields("TComis") = Text1(9)
            .Fields("TDescuentos") = Text1(12)
            .Fields("TPagar") = Text1(13)
            .Fields("Pagada") = "NO"
            .Fields("RetIIBB") = Text1(29)
            .Update
        End With
        Set rsEncabLiq = Nothing
        'graba en temporales
        With TrsEncabLiq
        .AddNew
        .Fields("NroLiq") = lPrimaryKey
        .Fields("CodFlet") = Text1(0)
        .Fields("DescFlet") = Text1(1)
        .Fields("Fecha") = Fecha(0)
        .Fields("Obs") = Text1(2)
        .Fields("TNetoViajes") = Text1(3)
        .Fields("TIVAViajes") = Text1(4)
        .Fields("TViajes") = Text1(5)
        .Fields("TNetoComis") = Text1(7)
        .Fields("TIVAComis") = Text1(8)
        .Fields("TComis") = Text1(9)
        .Fields("TDescuentos") = Text1(12)
        .Fields("TPagar") = Text1(13)
        .Fields("RetIIBB") = Text1(29)
        .Update
        End With
        Set TrsEncabLiq = Nothing
        'graba detalle viajes
        Dim VNroViaje As Double
        Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Order By NroViaje")
        rsLiqDetViajes.MoveLast
        Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 15")
        VNroViaje = rsComprobantes!UltNro
        Items = 0
        For Items = Items + 1 To ListaViajes.ListItems.Count
            Set Lista = ListaViajes.ListItems.Item(Items)
            With rsLiqDetViajes
            .AddNew
            .Fields("NroLiq") = lPrimaryKey
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = "NO"
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("codFlet") = Text1(0)
            .Fields("NroViaje") = VNroViaje
            .Update
            End With
            With TrsLiqDetViajes
            .AddNew
            .Fields("NroLiq") = lPrimaryKey
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Provincia") = Provincia.ListIndex + 1
            .Update
            End With
            With rsViajesFact
            .AddNew
            .Fields("NroLiq") = lPrimaryKey
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = "NO"
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("codFlet") = Text1(0)
            .Fields("NroViaje") = VNroViaje
            .Update
        End With
        VNroViaje = VNroViaje + 1
    Next
    rsComprobantes.Edit
    rsComprobantes!UltNro = VNroViaje
    rsComprobantes.Update
    Set rsComprobantes = Nothing
    Set rsLiqDetViajes = Nothing
    Set TrsLiqDetViajes = Nothing
    'graba detalle descuentos
    Items = 0
    For Items = Items + 1 To ListDescuentos.ListItems.Count
        Set Lista = ListDescuentos.ListItems.Item(Items)
        With rsLiqDetDesc
            .AddNew
            .Fields("NroLiq") = lPrimaryKey
            .Fields("NroRemito") = Lista.Tag
            .Fields("Efvo") = Lista.SubItems(1)
            .Fields("Gas-Oil") = Lista.SubItems(2)
            .Fields("Faltante") = Lista.SubItems(3)
            .Update
        End With
        With TrsLiqDetDesc
            .AddNew
            .Fields("NroLiq") = lPrimaryKey
            .Fields("NroRemito") = Lista.Tag
            .Fields("Efvo") = Lista.SubItems(1)
            .Fields("Gas-Oil") = Lista.SubItems(2)
            .Fields("Faltante") = Lista.SubItems(3)
            .Update
        End With
        'acutaliza estado
        Set rsGasOilFleteros = db.OpenRecordset("Select * from GasOilFleteros Where CodFlet = " & Text1(0) & " And NroFact = " & Lista.Tag & "")
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
    Set rsLiqDetDesc = Nothing
    Set TrsLiqDetDesc = Nothing
    Else
        MsgBox "Liquidacion con Nro 0(cero) - NUEVA"
        Exit Sub
    End If
End If
If Accion = "Modificar" Then
    Set TrsEncabLiq = dbTemp.OpenRecordset("EncabLiquidacion")
    Set TrsLiqDetViajes = dbTemp.OpenRecordset("LiqDetViajes")
    Set TrsLiqDetDesc = dbTemp.OpenRecordset("LiqDetDescuentos")
    'limpia temporales
    Do While Not TrsEncabLiq.EOF
        TrsEncabLiq.Delete
        TrsEncabLiq.MoveNext
    Loop
    Do While Not TrsLiqDetViajes.EOF
        TrsLiqDetViajes.Delete
        TrsLiqDetViajes.MoveNext
    Loop
    Do While Not TrsLiqDetDesc.EOF
        TrsLiqDetDesc.Delete
        TrsLiqDetDesc.MoveNext
    Loop
    Set rsEncabLiq = db.OpenRecordset("SELECT * FROM EncabLiquidacion WHERE NroLiq = " & Text1(28) & "")
    Set rsLiqDetViajes = db.OpenRecordset("SELECT * FROM LiqDetViajes WHERE NroLiq = " & Text1(28) & "")
    Set rsViajesFact = db.OpenRecordset("SELECT * FROM ViajesFactura WHERE NroLiq = " & Text1(28) & "")
    Set rsLiqDetDesc = db.OpenRecordset("SELECT * FROM LiqDetDescuentos WHERE NroLiq = " & Text1(28) & "")
    If Not rsEncabLiq.EOF And Not rsEncabLiq.BOF Then
        rsEncabLiq.Edit
        rsEncabLiq.Fields("CodFlet") = Text1(0)
        rsEncabLiq.Fields("Fecha") = Fecha(0)
        rsEncabLiq.Fields("Obs") = Text1(2)
        rsEncabLiq.Fields("TNetoViajes") = Text1(3)
        rsEncabLiq.Fields("TIVAViajes") = Text1(4)
        rsEncabLiq.Fields("TViajes") = Text1(5)
        rsEncabLiq.Fields("TNetoComis") = Text1(7)
        rsEncabLiq.Fields("TIVAComis") = Text1(8)
        rsEncabLiq.Fields("TComis") = Text1(9)
        rsEncabLiq.Fields("TDescuentos") = Text1(12)
        rsEncabLiq.Fields("TPagar") = Text1(13)
        rsEncabLiq.Update
    End If
    Do While Not rsLiqDetViajes.EOF
        rsLiqDetViajes.Delete
        rsLiqDetViajes.MoveNext
    Loop
    Do While Not rsViajesFact.EOF
        rsViajesFact.Delete
        rsViajesFact.MoveNext
    Loop
    Do While Not rsLiqDetDesc.EOF
        rsLiqDetDesc.Delete
        rsLiqDetDesc.MoveNext
    Loop
    'borrra liquidacion vieja
    'graba encabezado liquidacion
    Set rsEncabLiq = Nothing
    Set rsLiqDetViajes = Nothing
    Set rsLiqDetDesc = Nothing
    Set rsEncabLiq = db.OpenRecordset("EncabLiquidacion")
    Set rsLiqDetViajes = db.OpenRecordset("LiqDetViajes")
    Set rsLiqDetDesc = db.OpenRecordset("LiqDetDescuentos")
    Set rsViajesFact = db.OpenRecordset("ViajesFactura")
    ' recupera una clave única desde la rutina GetPrimaryKey
    'graba en temporales
    With TrsEncabLiq
        .AddNew
        .Fields("NroLiq") = Text1(28)
        .Fields("CodFlet") = Text1(0)
        .Fields("DescFlet") = Text1(1)
        .Fields("Fecha") = Fecha(0)
        .Fields("Obs") = Text1(2)
        .Fields("TNetoViajes") = Text1(3)
        .Fields("TIVAViajes") = Text1(4)
        .Fields("TViajes") = Text1(5)
        .Fields("TNetoComis") = Text1(7)
        .Fields("TIVAComis") = Text1(8)
        .Fields("TComis") = Text1(9)
        .Fields("TDescuentos") = Text1(12)
        .Fields("TPagar") = Text1(13)
        .Update
    End With
    Set TrsEncabLiq = Nothing
    'graba detalle viajes
    rsLiqDetViajes.MoveLast
    Set rsComprobantes = db.OpenRecordset("Select * From Comprobantes Where CodComp = 15")
    VNroViaje = rsComprobantes!UltNro
    Items = 0
    For Items = Items + 1 To ListaViajes.ListItems.Count
        Set Lista = ListaViajes.ListItems.Item(Items)
        With rsLiqDetViajes
            .AddNew
            .Fields("NroLiq") = Text1(28)
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = Lista.SubItems(14)
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("NroViaje") = VNroViaje
            .Fields("CodFlet") = Text1(0)
            .Update
        End With
        With rsViajesFact
            .AddNew
            .Fields("NroLiq") = Text1(28)
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Fields("Facturado") = Lista.SubItems(14)
            .Fields("Provincia") = Lista.SubItems(12)
            .Fields("NroViaje") = VNroViaje
            .Fields("CodFlet") = Text1(0)
            .Update
        End With
        VNroViaje = VNroViaje + 1
        With TrsLiqDetViajes
            .AddNew
            .Fields("NroLiq") = Text1(28)
            .Fields("CodEmpresa") = Lista.SubItems(10)
            .Fields("Fecha") = Lista.Tag
            .Fields("NroRemito") = Lista.SubItems(1)
            .Fields("DescEmpresa") = Lista.SubItems(2)
            .Fields("CodChofer") = Lista.SubItems(11)
            .Fields("DescChofer") = Lista.SubItems(3)
            .Fields("Mercaderia") = Lista.SubItems(4)
            .Fields("Procedencia") = Lista.SubItems(5)
            .Fields("Destino") = Lista.SubItems(6)
            .Fields("Kilos") = Lista.SubItems(7)
            .Fields("Tarifa") = Lista.SubItems(8)
            .Fields("SubTotal") = Lista.SubItems(9)
            .Update
        End With
    Next
    rsComprobantes.Edit
    rsComprobantes!UltNro = VNroViaje
    rsComprobantes.Update
    Set rsComprobantes = Nothing
    Set rsLiqDetViajes = Nothing
    Set rsViajesFact = Nothing
    Set TrsLiqDetViajes = Nothing
    'graba detalle descuentos
    Items = 0
    For Items = Items + 1 To ListDescuentos.ListItems.Count
        Set Lista = ListDescuentos.ListItems.Item(Items)
        With rsLiqDetDesc
            .AddNew
            .Fields("NroLiq") = Text1(28)
            .Fields("NroRemito") = Lista.Tag
            .Fields("Efvo") = Lista.SubItems(1)
            .Fields("Gas-Oil") = Lista.SubItems(2)
            .Fields("Faltante") = Lista.SubItems(3)
            .Update
        End With
        With TrsLiqDetDesc
            .AddNew
            .Fields("NroLiq") = Text1(28)
            .Fields("NroRemito") = Lista.Tag
            .Fields("Efvo") = Lista.SubItems(1)
            .Fields("Gas-Oil") = Lista.SubItems(2)
            .Fields("Faltante") = Lista.SubItems(3)
            .Update
        End With
        Set rsGasOilFleteros = db.OpenRecordset("Select * from GasOilFleteros Where CodFlet = " & Text1(0) & " And NroFact = " & Lista.Tag & "")
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
    Set rsLiqDetDesc = Nothing
    Set TrsLiqDetDesc = Nothing
End If
Form_Initialize
Form_Load
Dim frmRep As New InfLiquidaciones
frmRep.Show vbModal
Exit Sub
ERR_cmdGrabarLiq:
    TableError Err
    Set rsEncabLiq = Nothing
    Set rsLiqDetViajes = Nothing
    Set rsLiqDetDesc = Nothing
End Sub
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEncabLiq
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        'If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("NroLiq") + 1
            
       ' Else
        '
         '   GetPrimaryKey = 1
        
      '  End If
        
    End With
End Function

Private Sub AgregarDesc_Click()
If Not Text1(24) = "" Then
    Set Lista = ListDescuentos.ListItems.Add(, , Text1(24))
        Lista.Tag = Text1(24)
        Lista.SubItems(1) = FormatNumber(Text1(25))
        Lista.SubItems(2) = FormatNumber(Text1(26))
        Lista.SubItems(3) = FormatNumber(Text1(27))
    TDescuentos = TDescuentos + Text1(25) + Text1(26) + Text1(27)
    TPagar = TPagar - Text1(25) - Text1(26) - Text1(27)
    Text1(12) = FormatNumber(TDescuentos)
    Text1(13) = FormatNumber(TPagar)
    Text1(24) = "": Text1(25) = "0.00": Text1(26) = "0.00": Text1(27) = "0.0"
Else
    MsgBox "Nro Remito es obligatorios", vbInformation
    Text1(24).SetFocus
End If
End Sub

Private Sub AgregarDesc_GotFocus()
If Not Text1(27) = "" Then
            If Not IsNumeric(Text1(27)) Then
                MsgBox "Debe ser numerico", vbInformation
                Text1(27).SetFocus
            End If
        Else
            Text1(27) = "0.00"
        End If
End Sub

Private Sub AgregarViaje_Click()
On Error GoTo ERR_cmdAgregarViajes
Dim ImpViaje As Double, IVA As Double
ImpViaje = 0: IVA = 0
Set Lista = ListaViajes.ListItems.Add(, , Fecha(1))
    Lista.Tag = Fecha(1)
    Lista.SubItems(1) = Text1(16)
    Lista.SubItems(2) = Text1(15)
    Lista.SubItems(3) = Text1(18)
    Lista.SubItems(4) = Text1(19)
    Lista.SubItems(5) = Text1(20)
    Lista.SubItems(6) = Text1(21)
    Lista.SubItems(7) = Text1(22)
    Lista.SubItems(8) = Text1(23)
    Lista.SubItems(10) = Text1(14)
    Lista.SubItems(11) = Text1(17)
    Lista.SubItems(12) = Provincia.ListIndex + 1
    Lista.SubItems(13) = VNroViaje
    Lista.SubItems(14) = "NO"
    VNroViaje = VNroViaje + 1
    'calcula viajes
    ImpViaje = (Text1(22) * Text1(23)) / 1000
    Lista.SubItems(9) = FormatNumber(ImpViaje)
    TViajesNeto = TViajesNeto + ImpViaje
    IVA = ImpViaje * 21 / 100
    TIVAViajes = TIVAViajes + IVA
    'calcula RET IIBB
    TRetIIBB = TViajesNeto * Text1(31) / 100
    Text1(3) = FormatNumber(TViajesNeto)
    Text1(4) = FormatNumber(TIVAViajes)
    Text1(29) = FormatNumber(TRetIIBB)
    TViajes = TViajes + IVA + ImpViaje + TRetIIBB
    Text1(5) = FormatNumber(TViajes)
    'calcula comisión
    TComisNeta = TViajesNeto * Text1(6) / 100
    TIVAComis = TComisNeta * 21 / 100
    TComis = TComisNeta + TIVAComis
    Text1(7) = FormatNumber(TComisNeta)
    Text1(8) = FormatNumber(TIVAComis)
    Text1(9) = FormatNumber(TComis)
    'calcula saldo a pagar
    Text1(10) = FormatNumber(TViajes)
    Text1(11) = FormatNumber(TComis)
    TPagar = TViajes - TComis - TDescuentos
    Text1(13) = FormatNumber(TPagar)
    Items = 14
    For Items = Items + 1 To 24
        Text1(Items - 1) = ""
    Next
    Text1(22) = "0.00"
    Text1(23) = "0.00"
    Fecha(1).SetFocus
    Exit Sub
ERR_cmdAgregarViajes:
    TableError Err
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

Private Sub AgregarViaje_GotFocus()
On Error Resume Next
        If Text1(23) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(23).SetFocus
            Exit Sub
        ElseIf IsNumeric(Text1(23)) = False Then
            MsgBox "El campo debe ser numerico", vbCritical
            Text1(23).SetFocus
            Exit Sub
        Else
            Text1(23) = FormatNumber(Text1(23))
        End If
End Sub

Private Sub Buscar_Click()
With ConsLiquidaciones
    .Show
    .Height = 4935
    .Width = 8235
    .Top = (Screen.Height - .Height) / 2
    .Left = (Screen.Width - .Width) / 2
End With
Accion = "Modificar"
End Sub

Private Sub Cancelar_Click()
Form_Initialize
Form_Load
End Sub

Private Sub CargarDesc_Click()
On Error Resume Next
DetLiq.Visible = False: Viajes.Visible = False
Descuentos.Top = 1560
Descuentos.Left = 120
Descuentos.Height = 5055
Descuentos.Width = 12015
Descuentos.Visible = True
Text1(24).SetFocus
End Sub

Private Sub CargarViajes_Click()
On Error Resume Next
DetLiq.Visible = False: Descuentos.Visible = False
Viajes.Top = 1560
Viajes.Left = 120
Viajes.Height = 5055
Viajes.Width = 12015
Viajes.Visible = True
Fecha(1).SetFocus
Fecha(1) = Date
End Sub

Private Sub Command1_Click()
Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Order By NroViaje")
VNroViaje = 0
Do While Not rsLiqDetViajes.EOF
    rsLiqDetViajes.Edit
    rsLiqDetViajes.Fields("NroViaje") = VNroViaje
    rsLiqDetViajes.Update
    rsLiqDetViajes.MoveNext
    VNroViaje = VNroViaje + 1
Loop
End Sub

Private Sub DescPendientes_DblClick()
Set LDescGO = DescPendientes.ListItems.Item(DescPendientes.SelectedItem.Index)
Text1(24) = LDescGO.SubItems(2)
Text1(26) = LDescGO.SubItems(3)
DescPendientes.ListItems.Remove (DescPendientes.SelectedItem.Index)
End Sub

Private Sub EliminarViaje_Click()
On Error Resume Next
Dim Borrar As Double, ImpViaje As Double, IVA As Double

If ListaViajes.ListItems.Item(ListaViajes.SelectedItem.Index) = "" Then
    MsgBox "Debe seleccion un Viaje", vbCritical
Else
    Set Lista = ListaViajes.ListItems.Item(ListaViajes.SelectedItem.Index)
    If Lista.SubItems(14) = "NO" Then
        ImpViaje = Lista.SubItems(9)
        'calcual viajes
        TViajesNeto = TViajesNeto - ImpViaje
        IVA = ImpViaje * 21 / 100
        TIVAViajes = TIVAViajes - IVA
        TViajes = TViajes - IVA - ImpViaje
        Text1(3) = FormatNumber(TViajesNeto)
        Text1(4) = FormatNumber(TIVAViajes)
        Text1(5) = FormatNumber(TViajes)
        'calcula comisión
        TComisNeta = TViajesNeto * Text1(6) / 100
        TIVAComis = TComisNeta * 21 / 100
        TComis = TComisNeta + TIVAComis
        Text1(7) = FormatNumber(TComisNeta)
        Text1(8) = FormatNumber(TIVAComis)
        Text1(9) = FormatNumber(TComis)
        'calcula saldo a pagar
        Text1(10) = FormatNumber(TViajes)
        Text1(11) = FormatNumber(TComis)
        TPagar = TViajes - TComis - TDescuentos
        Text1(13) = FormatNumber(TPagar)
        ListaViajes.ListItems.Remove (ListaViajes.SelectedItem.Index)
    Else
        MsgBox "El Viaje ya fue facturado,no se puede eliminar", vbInformation
    End If
End If
End Sub

Private Sub Fecha_LostFocus(Index As Integer)
On Error Resume Next
Select Case Index
    Case 0:
            If IsDate(Fecha(0)) = False Then
                MsgBox "Fecha no válida", vbInformation
                Fecha(0).SetFocus
                Exit Sub
            End If
    Case 1:
            If IsDate(Fecha(1)) = False Then
                MsgBox "Fecha no válida", vbInformation
                Fecha(1).SetFocus
                Exit Sub
            End If
    End Select
End Sub

Private Sub Form_Initialize()
Set rsFleteros = Nothing
Set rsEmpresas = Nothing
Set rsEncabLiq = Nothing
Set rsLiqDetViajes = Nothing
Set rsLiqDetDesc = Nothing
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call BuscarFlet
Case vbKeyF5: Call Aceptar_Click
End Select
End Sub
Private Sub BuscarFlet()
If OPBUSCAR = "FLETEROS" Then
    With BuscFlet
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "Liq"
    End With
End If
If OPBUSCAR = "EMPRESAS" Then
    With BuscEmpresas
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "Liq"
    End With
End If
If OPBUSCAR = "CHOFERES" Then
    With BuscChofer
        VCodflet = Liquidaciones.Text1(0)
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "Liq"
    End With
End If

End Sub

Private Sub Form_Load()
On Error Resume Next
Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Order By NroViaje")
rsLiqDetViajes.MoveLast
VNroViaje = rsLiqDetViajes!NroViaje + 1
Set rsLiqDetViajes = Nothing
Items = 0
For Items = Items + 1 To Text1.Count
    If Items > 0 And Items <= 3 Then
        Text1(Items - 1) = ""
    ElseIf Items >= 4 And Items <= 14 Then
        Text1(Items - 1) = "0.00"
    ElseIf Items >= 15 And Items <= 22 Then
        Text1(Items - 1) = ""
    ElseIf Items >= 23 And Items <= 24 Then
        Text1(Items - 1) = "0.00"
    ElseIf Items = 25 Then
        Text1(Items - 1) = ""
    ElseIf Items = 31 Then
        Text1(Items - 1) = ""
    Else
        Text1(Items - 1) = "0.00"
    End If
Next
Items = 0
For Items = Items + 1 To Fecha.Count
    Fecha(Items - 1).Text = ""
    Fecha(Items - 1).Mask = "##/##/####"
Next
Fecha(0) = Date
Set rsProvincias = db.OpenRecordset("Provincias")
Provincia.Clear
Do While Not rsProvincias.EOF
    Provincia.AddItem rsProvincias!DescProv
    rsProvincias.MoveNext
Loop
TViajesNeto = 0: TIVAViajes = 0: TViajes = 0
TComisNeta = 0: TIVAComis = 0: TComis = 0
TDescuentos = 0: TPagar = 0
ListaViajes.ListItems.Clear
ListDescuentos.ListItems.Clear
DetLiq.Visible = True: Viajes.Visible = False: Descuentos.Visible = False
DetLiq.Top = 1560
DetLiq.Left = 120
DetLiq.Height = 5295
DetLiq.Width = 8175
Accion = "Nuevo"
OPBUSCAR = "FLETEROS"
End Sub


Private Sub KewlButtons2_Click()
On Error Resume Next
Set Lista = ListDescuentos.ListItems.Item(ListDescuentos.SelectedItem.Index)
TPagar = TPagar + Lista.SubItems(1) + Lista.SubItems(2) + Lista.SubItems(3)
TDescuentos = TDescuentos - Lista.SubItems(1) - Lista.SubItems(2) - Lista.SubItems(3)
Text1(12) = FormatNumber(TDescuentos)
Text1(13) = FormatNumber(TPagar)
Set LDescGO = DescPendientes.ListItems.Add(, , "")
LDescGO.SubItems(2) = Lista.Tag
LDescGO.SubItems(3) = Lista.SubItems(2)
ListDescuentos.ListItems.Remove (ListDescuentos.SelectedItem.Index)
End Sub

Private Sub ListaViajes_DblClick()
Set Lista = ListaViajes.ListItems.Item(ListaViajes.SelectedItem.Index)
If Lista.SubItems(14) = "SI" Then
    MsgBox "El viaje no se puede modificar porque ya fue facturado"
Else
Dim ImpViaje As Double, IVA As Double
ImpViaje = 0: IVA = 0
    Fecha(1) = Lista.Tag
    Text1(16) = Lista.SubItems(1)
    Text1(15) = Lista.SubItems(2)
    Text1(18) = Lista.SubItems(3)
    Text1(19) = Lista.SubItems(4)
    Text1(20) = Lista.SubItems(5)
    Text1(21) = Lista.SubItems(6)
    Text1(22) = Lista.SubItems(7)
    Text1(23) = Lista.SubItems(8)
    Text1(14) = Lista.SubItems(10)
    Text1(17) = Lista.SubItems(11)
    Provincia.ListIndex = Lista.SubItems(12) - 1
    VNroViaje = Lista.SubItems(13)
    'calcula viajes
    ImpViaje = (Text1(22) * Text1(23)) / 1000
    'Lista.SubItems(9) = FormatNumber(ImpViaje)
    TViajesNeto = TViajesNeto - ImpViaje
    IVA = ImpViaje * 21 / 100
    TIVAViajes = TIVAViajes - IVA
    'calcula RET IIBB
    TRetIIBB = TViajesNeto * Text1(31) / 100
    Text1(3) = FormatNumber(TViajesNeto)
    Text1(4) = FormatNumber(TIVAViajes)
    Text1(29) = FormatNumber(TRetIIBB)
    TViajes = TViajes - IVA - ImpViaje - TRetIIBB
    Text1(5) = FormatNumber(TViajes)
    'calcula comisión
    TComisNeta = TViajesNeto * Text1(6) / 100
    TIVAComis = TComisNeta * 21 / 100
    TComis = TComisNeta + TIVAComis
    Text1(7) = FormatNumber(TComisNeta)
    Text1(8) = FormatNumber(TIVAComis)
    Text1(9) = FormatNumber(TComis)
    'calcula saldo a pagar
    Text1(10) = FormatNumber(TViajes)
    Text1(11) = FormatNumber(TComis)
    TPagar = TViajes - TComis - TDescuentos
    Text1(13) = FormatNumber(TPagar)
    Items = 14
    ListaViajes.ListItems.Remove (ListaViajes.SelectedItem.Index)
    Fecha(1).SetFocus
End If
End Sub

Private Sub Text1_Change(Index As Integer)
If Index = 2 Then
    Tamaño = Len(Text1(2))
    If Tamaño > 50 Then
        MsgBox "El campo no puede tener mas de 50 caracteres", vbInformation
        Text1(2).Text = Mid(Text1(2), 1, Tamaño - 1)
    End If
End If

End Sub

Private Sub Text1_GotFocus(Index As Integer)
On Error Resume Next
Select Case Index
    Case 0: OPBUSCAR = "FLETEROS"
    Case 14: OPBUSCAR = "EMPRESAS"
    Case 16: 'controla empresa
        If Text1(15) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(14).SetFocus
            Exit Sub
        End If
    Case 17: OPBUSCAR = "CHOFERES"
    Case 19:
        If Text1(18) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(17).SetFocus
            Exit Sub
        End If
        
    Case 20:
        If Text1(19) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(19).SetFocus
            Exit Sub
        End If
    Case 21:
        If Text1(20) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(20).SetFocus
            Exit Sub
        End If
    Case 22:
        If Text1(21) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(21).SetFocus
            Exit Sub
        End If
    Case 23:
        If Text1(22) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(22).SetFocus
            Exit Sub
        ElseIf IsNumeric(Text1(22)) = False Then
            MsgBox "El campo debe ser numerico", vbCritical
            Text1(22).SetFocus
            Exit Sub
        Else
            Text1(22) = FormatNumber(Text1(22))
        End If
    Case 25:
        If Text1(24) = "" Then
            MsgBox "Campo Obligatorios", vbInformation
            Text1(24).SetFocus
        End If
    Case 26:
        If Not Text1(25) = "" Then
            If Not IsNumeric(Text1(25)) Then
                MsgBox "Debe ser numerico", vbInformation
                Text1(25).SetFocus
            End If
        Else
            Text1(25) = "0.00"
        End If
    Case 27:
        If Not Text1(26) = "" Then
            If Not IsNumeric(Text1(26)) Then
                MsgBox "Debe ser numerico", vbInformation
                Text1(26).SetFocus
            End If
        Else
            Text1(26) = "0.00"
        End If
End Select
End Sub

Private Sub Text1_LostFocus(Index As Integer)
On Error Resume Next
Select Case Index
    Case 0: 'busca Descripcion Fletero
        If Not Text1(0) = "" Then
            Set rsFleteros = db.OpenRecordset("Select * from Fleteros Where CodFlet = " & Text1(0) & "", 2)
            If Not rsFleteros.EOF And Not rsFleteros.BOF Then
                Text1(1) = rsFleteros!DescFlet
                Text1(6) = FormatNumber(rsFleteros!Comision)
                If rsFleteros!IIBB = 1 Then
                    Text1(30) = "Exento"
                    Text1(31) = "0.00"
                ElseIf rsFleteros!IIBB = 2 Then
                    Text1(30) = "Agente de Retención"
                    Text1(31) = FormatNumber(rsFleteros!PorIIBB)
                End If
            Else
                MsgBox "El Fleteros no existe"
                Text1(0).SetFocus
            End If
            Set rsFleteros = Nothing
            'busca descuentos pendiente
            DescPendientes.ListItems.Clear
            Set rsGasOilFleteros = db.OpenRecordset("SELECT * FROM GasOilFleteros WHERE CodFlet = " & Text1(0) & "")
            Do While Not rsGasOilFleteros.EOF
                If rsGasOilFleteros!codflet = Text1(0) And rsGasOilFleteros!Descontada = "NO" Then
                    Set LDescGO = DescPendientes.ListItems.Add(, , rsGasOilFleteros!Fecha)
                    LDescGO.Tag = rsGasOilFleteros.Fields("Fecha")
                    LDescGO.SubItems(1) = rsGasOilFleteros.Fields("PtoVta")
                    LDescGO.SubItems(2) = rsGasOilFleteros.Fields("NroFact")
                    LDescGO.SubItems(3) = FormatNumber(rsGasOilFleteros.Fields("Importe"))
                End If
                rsGasOilFleteros.MoveNext
            Loop
            Set rsGasOilFleteros = Nothing
            Exit Sub
        End If
        
    Case 1:
        If Text1(1) = "" Then
            MsgBox "Campo requerido", vbCritical
            Text1(0).SetFocus
            Exit Sub
        End If
    Case 14: ' busca descripcion empresa
        If Not Text1(14) = "" Then
            Set rsEmpresas = db.OpenRecordset("Select * from Empresas Where CodEmpresas = " & Text1(14) & "", 2)
            If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
                Text1(15) = rsEmpresas!DescEmpresas
            Else
                MsgBox "La empresas no existe"
                Text1(14).SetFocus
            End If
            Set rsemrpesas = Nothing
            Exit Sub
        End If
    Case 16:
        Set rsLiqDetViajes = db.OpenRecordset("Select * From LiqDetViajes Where NroRemito = '" & Text1(16) & "' And CodEmpresa = " & Text1(14) & "")
        If Not rsLiqDetViajes.EOF And Not rsLiqDetViajes.BOF Then
            MsgBox "La carta de porte ya fue cargada", vbInformation
            Text1(16).SetFocus
        End If
    Case 17: ' busca descpcion chofer
        If Not Text1(17) = "" Then
            Set rsChoferes = db.OpenRecordset("Select * from Choferes Where CodFlet = " & Text1(0) & " AND CodChoferes = " & Text1(17) & "", 2)
            If Not rsChoferes.EOF And Not rsChoferes.BOF Then
                Text1(18) = rsChoferes!AyN
            Else
                MsgBox "El Chofer no pertenece al fletero"
                Text1(17).SetFocus
            End If
            Set rsChoferes = Nothing
            Exit Sub
        End If
End Select
End Sub

Private Sub Volver_Click()
On Error Resume Next
DetLiq.Visible = True: Viajes.Visible = False
DetLiq.Top = 1560
DetLiq.Left = 120
DetLiq.Height = 5295
DetLiq.Width = 8175
End Sub

Private Sub VolverDesc_Click()
On Error Resume Next
DetLiq.Visible = True: Descuentos.Visible = False
DetLiq.Top = 1560
DetLiq.Left = 120
DetLiq.Height = 5295
DetLiq.Width = 8175
End Sub
