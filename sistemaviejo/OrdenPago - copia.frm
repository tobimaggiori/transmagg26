VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "KewlButtonz.ocx"
Begin VB.Form OrdenPago 
   Caption         =   "Orden de Pago"
   ClientHeight    =   9750
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   9030
   KeyPreview      =   -1  'True
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   9750
   ScaleWidth      =   9030
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      HideSelection   =   0   'False
      Index           =   48
      Left            =   6480
      TabIndex        =   94
      Text            =   "Text1"
      Top             =   9360
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      HideSelection   =   0   'False
      Index           =   47
      Left            =   6480
      TabIndex        =   93
      Text            =   "Text1"
      Top             =   9000
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
      Height          =   285
      HideSelection   =   0   'False
      Index           =   46
      Left            =   6480
      TabIndex        =   92
      Text            =   "Text1"
      Top             =   8640
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
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
      Appearance      =   0  'Flat
      Height          =   285
      Index           =   1
      Left            =   1200
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   480
      Width           =   975
   End
   Begin VB.TextBox Text1 
      Appearance      =   0  'Flat
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
      MICON           =   "OrdenPago.frx":0000
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
      MICON           =   "OrdenPago.frx":001C
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
      MICON           =   "OrdenPago.frx":0038
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
      MICON           =   "OrdenPago.frx":0054
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
      MICON           =   "OrdenPago.frx":0070
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
      TabIndex        =   76
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
      MICON           =   "OrdenPago.frx":008C
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Frame FactPendientes 
      Caption         =   "Aplicar Facturas"
      ForeColor       =   &H00C00000&
      Height          =   5880
      Left            =   120
      TabIndex        =   81
      Top             =   1800
      Width           =   8655
      Begin VB.Frame Frame4 
         BorderStyle     =   0  'None
         Caption         =   "Frame4"
         Height          =   13215
         Left            =   120
         TabIndex        =   83
         Top             =   720
         Width           =   7935
         Begin VB.Frame Frame5 
            BorderStyle     =   0  'None
            Caption         =   "Frame4"
            Height          =   15855
            Left            =   120
            TabIndex        =   95
            Top             =   -240
            Width           =   9255
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   4
               Left            =   5160
               TabIndex        =   311
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   3
               Left            =   3840
               TabIndex        =   310
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   2
               Left            =   2280
               TabIndex        =   309
               Text            =   "Text4"
               Top             =   240
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   1
               Left            =   1560
               TabIndex        =   308
               Text            =   "Text4"
               Top             =   240
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Height          =   285
               Index           =   0
               Left            =   240
               TabIndex        =   307
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   5
               Left            =   6480
               TabIndex        =   306
               Text            =   "Text4"
               Top             =   240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   6
               Left            =   240
               TabIndex        =   305
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   7
               Left            =   1560
               TabIndex        =   304
               Text            =   "Text4"
               Top             =   600
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   8
               Left            =   2280
               TabIndex        =   303
               Text            =   "Text4"
               Top             =   600
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   9
               Left            =   3840
               TabIndex        =   302
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   10
               Left            =   5160
               TabIndex        =   301
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   11
               Left            =   6480
               TabIndex        =   300
               Text            =   "Text4"
               Top             =   600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   12
               Left            =   240
               TabIndex        =   299
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   13
               Left            =   1560
               TabIndex        =   298
               Text            =   "Text4"
               Top             =   960
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   14
               Left            =   2280
               TabIndex        =   297
               Text            =   "Text4"
               Top             =   960
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   15
               Left            =   3840
               TabIndex        =   296
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   16
               Left            =   5160
               TabIndex        =   295
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   17
               Left            =   6480
               TabIndex        =   294
               Text            =   "Text4"
               Top             =   960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   18
               Left            =   240
               TabIndex        =   293
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   19
               Left            =   1560
               TabIndex        =   292
               Text            =   "Text4"
               Top             =   1320
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   20
               Left            =   2280
               TabIndex        =   291
               Text            =   "Text4"
               Top             =   1320
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   21
               Left            =   3840
               TabIndex        =   290
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   22
               Left            =   5160
               TabIndex        =   289
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   23
               Left            =   6480
               TabIndex        =   288
               Text            =   "Text4"
               Top             =   1320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   24
               Left            =   240
               TabIndex        =   287
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   25
               Left            =   1560
               TabIndex        =   286
               Text            =   "Text4"
               Top             =   1680
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   26
               Left            =   2280
               TabIndex        =   285
               Text            =   "Text4"
               Top             =   1680
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   27
               Left            =   3840
               TabIndex        =   284
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   28
               Left            =   5160
               TabIndex        =   283
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   29
               Left            =   6480
               TabIndex        =   282
               Text            =   "Text4"
               Top             =   1680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   30
               Left            =   240
               TabIndex        =   281
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   31
               Left            =   1560
               TabIndex        =   280
               Text            =   "Text4"
               Top             =   2040
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   32
               Left            =   2280
               TabIndex        =   279
               Text            =   "Text4"
               Top             =   2040
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   33
               Left            =   3840
               TabIndex        =   278
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   34
               Left            =   5160
               TabIndex        =   277
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   35
               Left            =   6480
               TabIndex        =   276
               Text            =   "Text4"
               Top             =   2040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   36
               Left            =   240
               TabIndex        =   275
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   37
               Left            =   1560
               TabIndex        =   274
               Text            =   "Text4"
               Top             =   2400
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   38
               Left            =   2280
               TabIndex        =   273
               Text            =   "Text4"
               Top             =   2400
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   39
               Left            =   3840
               TabIndex        =   272
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   40
               Left            =   5160
               TabIndex        =   271
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   41
               Left            =   6480
               TabIndex        =   270
               Text            =   "Text4"
               Top             =   2400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   42
               Left            =   240
               TabIndex        =   269
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   43
               Left            =   1560
               TabIndex        =   268
               Text            =   "Text4"
               Top             =   2760
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   44
               Left            =   2280
               TabIndex        =   267
               Text            =   "Text4"
               Top             =   2760
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   45
               Left            =   3840
               TabIndex        =   266
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   46
               Left            =   5160
               TabIndex        =   265
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   47
               Left            =   6480
               TabIndex        =   264
               Text            =   "Text4"
               Top             =   2760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   48
               Left            =   240
               TabIndex        =   263
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   49
               Left            =   1560
               TabIndex        =   262
               Text            =   "Text4"
               Top             =   3120
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   50
               Left            =   2280
               TabIndex        =   261
               Text            =   "Text4"
               Top             =   3120
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   51
               Left            =   3840
               TabIndex        =   260
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   52
               Left            =   5160
               TabIndex        =   259
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   53
               Left            =   6480
               TabIndex        =   258
               Text            =   "Text4"
               Top             =   3120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   54
               Left            =   240
               TabIndex        =   257
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   55
               Left            =   1560
               TabIndex        =   256
               Text            =   "Text4"
               Top             =   3480
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   56
               Left            =   2280
               TabIndex        =   255
               Text            =   "Text4"
               Top             =   3480
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   57
               Left            =   3840
               TabIndex        =   254
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   58
               Left            =   5160
               TabIndex        =   253
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   59
               Left            =   6480
               TabIndex        =   252
               Text            =   "Text4"
               Top             =   3480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   60
               Left            =   240
               TabIndex        =   251
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   61
               Left            =   1560
               TabIndex        =   250
               Text            =   "Text4"
               Top             =   3840
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   62
               Left            =   2280
               TabIndex        =   249
               Text            =   "Text4"
               Top             =   3840
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   63
               Left            =   3840
               TabIndex        =   248
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   64
               Left            =   5160
               TabIndex        =   247
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   65
               Left            =   6480
               TabIndex        =   246
               Text            =   "Text4"
               Top             =   3840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   71
               Left            =   6480
               TabIndex        =   245
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   70
               Left            =   5160
               TabIndex        =   244
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   69
               Left            =   3840
               TabIndex        =   243
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   68
               Left            =   2280
               TabIndex        =   242
               Text            =   "Text4"
               Top             =   4200
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   67
               Left            =   1560
               TabIndex        =   241
               Text            =   "Text4"
               Top             =   4200
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   66
               Left            =   240
               TabIndex        =   240
               Text            =   "Text4"
               Top             =   4200
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   77
               Left            =   6480
               TabIndex        =   239
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   76
               Left            =   5160
               TabIndex        =   238
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   75
               Left            =   3840
               TabIndex        =   237
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   74
               Left            =   2280
               TabIndex        =   236
               Text            =   "Text4"
               Top             =   4560
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   73
               Left            =   1560
               TabIndex        =   235
               Text            =   "Text4"
               Top             =   4560
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   72
               Left            =   240
               TabIndex        =   234
               Text            =   "Text4"
               Top             =   4560
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   83
               Left            =   6480
               TabIndex        =   233
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   82
               Left            =   5160
               TabIndex        =   232
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   81
               Left            =   3840
               TabIndex        =   231
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   80
               Left            =   2280
               TabIndex        =   230
               Text            =   "Text4"
               Top             =   4920
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   79
               Left            =   1560
               TabIndex        =   229
               Text            =   "Text4"
               Top             =   4920
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   78
               Left            =   240
               TabIndex        =   228
               Text            =   "Text4"
               Top             =   4920
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   84
               Left            =   240
               TabIndex        =   227
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   85
               Left            =   1560
               TabIndex        =   226
               Text            =   "Text4"
               Top             =   5280
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   86
               Left            =   2280
               TabIndex        =   225
               Text            =   "Text4"
               Top             =   5280
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   87
               Left            =   3840
               TabIndex        =   224
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   88
               Left            =   5160
               TabIndex        =   223
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   89
               Left            =   6480
               TabIndex        =   222
               Text            =   "Text4"
               Top             =   5280
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   90
               Left            =   240
               TabIndex        =   221
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BorderStyle     =   0  'None
               Height          =   285
               Index           =   91
               Left            =   1560
               TabIndex        =   220
               Text            =   "Text4"
               Top             =   5640
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   92
               Left            =   2280
               TabIndex        =   219
               Text            =   "Text4"
               Top             =   5640
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   93
               Left            =   3840
               TabIndex        =   218
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   94
               Left            =   5160
               TabIndex        =   217
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   95
               Left            =   6480
               TabIndex        =   216
               Text            =   "Text4"
               Top             =   5640
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   96
               Left            =   240
               TabIndex        =   215
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   97
               Left            =   1560
               TabIndex        =   214
               Text            =   "Text4"
               Top             =   6000
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   98
               Left            =   2280
               TabIndex        =   213
               Text            =   "Text4"
               Top             =   6000
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   99
               Left            =   3840
               TabIndex        =   212
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   100
               Left            =   5160
               TabIndex        =   211
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   101
               Left            =   6480
               TabIndex        =   210
               Text            =   "Text4"
               Top             =   6000
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   102
               Left            =   240
               TabIndex        =   209
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   103
               Left            =   1560
               TabIndex        =   208
               Text            =   "Text4"
               Top             =   6360
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   104
               Left            =   2280
               TabIndex        =   207
               Text            =   "Text4"
               Top             =   6360
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   105
               Left            =   3840
               TabIndex        =   206
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   106
               Left            =   5160
               TabIndex        =   205
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   107
               Left            =   6480
               TabIndex        =   204
               Text            =   "Text4"
               Top             =   6360
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   108
               Left            =   240
               TabIndex        =   203
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   109
               Left            =   1560
               TabIndex        =   202
               Text            =   "Text4"
               Top             =   6720
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   110
               Left            =   2280
               TabIndex        =   201
               Text            =   "Text4"
               Top             =   6720
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   111
               Left            =   3840
               TabIndex        =   200
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   112
               Left            =   5160
               TabIndex        =   199
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   113
               Left            =   6480
               TabIndex        =   198
               Text            =   "Text4"
               Top             =   6720
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   114
               Left            =   240
               TabIndex        =   197
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   115
               Left            =   1560
               TabIndex        =   196
               Text            =   "Text4"
               Top             =   7080
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   116
               Left            =   2280
               TabIndex        =   195
               Text            =   "Text4"
               Top             =   7080
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   117
               Left            =   3840
               TabIndex        =   194
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   118
               Left            =   5160
               TabIndex        =   193
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   119
               Left            =   6480
               TabIndex        =   192
               Text            =   "Text4"
               Top             =   7080
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   120
               Left            =   240
               TabIndex        =   191
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   121
               Left            =   1560
               TabIndex        =   190
               Text            =   "Text4"
               Top             =   7440
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   122
               Left            =   2280
               TabIndex        =   189
               Text            =   "Text4"
               Top             =   7440
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   123
               Left            =   3840
               TabIndex        =   188
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   124
               Left            =   5160
               TabIndex        =   187
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   125
               Left            =   6480
               TabIndex        =   186
               Text            =   "Text4"
               Top             =   7440
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   126
               Left            =   240
               TabIndex        =   185
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   127
               Left            =   1560
               TabIndex        =   184
               Text            =   "Text4"
               Top             =   7800
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   128
               Left            =   2280
               TabIndex        =   183
               Text            =   "Text4"
               Top             =   7800
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   129
               Left            =   3840
               TabIndex        =   182
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   130
               Left            =   5160
               TabIndex        =   181
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   131
               Left            =   6480
               TabIndex        =   180
               Text            =   "Text4"
               Top             =   7800
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   132
               Left            =   240
               TabIndex        =   179
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   133
               Left            =   1560
               TabIndex        =   178
               Text            =   "Text4"
               Top             =   8160
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   134
               Left            =   2280
               TabIndex        =   177
               Text            =   "Text4"
               Top             =   8160
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   135
               Left            =   3840
               TabIndex        =   176
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   136
               Left            =   5160
               TabIndex        =   175
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   137
               Left            =   6480
               TabIndex        =   174
               Text            =   "Text4"
               Top             =   8160
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   138
               Left            =   240
               TabIndex        =   173
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   139
               Left            =   1560
               TabIndex        =   172
               Text            =   "Text4"
               Top             =   8520
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   140
               Left            =   2280
               TabIndex        =   171
               Text            =   "Text4"
               Top             =   8520
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   141
               Left            =   3840
               TabIndex        =   170
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   142
               Left            =   5160
               TabIndex        =   169
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   143
               Left            =   6480
               TabIndex        =   168
               Text            =   "Text4"
               Top             =   8520
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   144
               Left            =   240
               TabIndex        =   167
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   145
               Left            =   1560
               TabIndex        =   166
               Text            =   "Text4"
               Top             =   8880
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   146
               Left            =   2280
               TabIndex        =   165
               Text            =   "Text4"
               Top             =   8880
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   147
               Left            =   3840
               TabIndex        =   164
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   148
               Left            =   5160
               TabIndex        =   163
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   149
               Left            =   6480
               TabIndex        =   162
               Text            =   "Text4"
               Top             =   8880
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   150
               Left            =   240
               TabIndex        =   161
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   151
               Left            =   1560
               TabIndex        =   160
               Text            =   "Text4"
               Top             =   9240
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   152
               Left            =   2280
               TabIndex        =   159
               Text            =   "Text4"
               Top             =   9240
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   153
               Left            =   3840
               TabIndex        =   158
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   154
               Left            =   5160
               TabIndex        =   157
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   155
               Left            =   6480
               TabIndex        =   156
               Text            =   "Text4"
               Top             =   9240
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   156
               Left            =   240
               TabIndex        =   155
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   157
               Left            =   1560
               TabIndex        =   154
               Text            =   "Text4"
               Top             =   9600
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   158
               Left            =   2280
               TabIndex        =   153
               Text            =   "Text4"
               Top             =   9600
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   159
               Left            =   3840
               TabIndex        =   152
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   160
               Left            =   5160
               TabIndex        =   151
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   161
               Left            =   6480
               TabIndex        =   150
               Text            =   "Text4"
               Top             =   9600
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   162
               Left            =   240
               TabIndex        =   149
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   163
               Left            =   1560
               TabIndex        =   148
               Text            =   "Text4"
               Top             =   9960
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   164
               Left            =   2280
               TabIndex        =   147
               Text            =   "Text4"
               Top             =   9960
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   165
               Left            =   3840
               TabIndex        =   146
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   166
               Left            =   5160
               TabIndex        =   145
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   167
               Left            =   6480
               TabIndex        =   144
               Text            =   "Text4"
               Top             =   9960
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   168
               Left            =   240
               TabIndex        =   143
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   169
               Left            =   1560
               TabIndex        =   142
               Text            =   "Text4"
               Top             =   10320
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   170
               Left            =   2280
               TabIndex        =   141
               Text            =   "Text4"
               Top             =   10320
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   171
               Left            =   3840
               TabIndex        =   140
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   172
               Left            =   5160
               TabIndex        =   139
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   173
               Left            =   6480
               TabIndex        =   138
               Text            =   "Text4"
               Top             =   10320
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   174
               Left            =   240
               TabIndex        =   137
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   175
               Left            =   1560
               TabIndex        =   136
               Text            =   "Text4"
               Top             =   10680
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   176
               Left            =   2280
               TabIndex        =   135
               Text            =   "Text4"
               Top             =   10680
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   177
               Left            =   3840
               TabIndex        =   134
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   178
               Left            =   5160
               TabIndex        =   133
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   179
               Left            =   6480
               TabIndex        =   132
               Text            =   "Text4"
               Top             =   10680
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   180
               Left            =   240
               TabIndex        =   131
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   181
               Left            =   1560
               TabIndex        =   130
               Text            =   "Text4"
               Top             =   11040
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   182
               Left            =   2280
               TabIndex        =   129
               Text            =   "Text4"
               Top             =   11040
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   183
               Left            =   3840
               TabIndex        =   128
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   184
               Left            =   5160
               TabIndex        =   127
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   185
               Left            =   6480
               TabIndex        =   126
               Text            =   "Text4"
               Top             =   11040
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   186
               Left            =   240
               TabIndex        =   125
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   187
               Left            =   1560
               TabIndex        =   124
               Text            =   "Text4"
               Top             =   11400
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   188
               Left            =   2280
               TabIndex        =   123
               Text            =   "Text4"
               Top             =   11400
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   189
               Left            =   3840
               TabIndex        =   122
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   190
               Left            =   5160
               TabIndex        =   121
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   191
               Left            =   6480
               TabIndex        =   120
               Text            =   "Text4"
               Top             =   11400
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   192
               Left            =   240
               TabIndex        =   119
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   193
               Left            =   1560
               TabIndex        =   118
               Text            =   "Text4"
               Top             =   11760
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   194
               Left            =   2280
               TabIndex        =   117
               Text            =   "Text4"
               Top             =   11760
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   195
               Left            =   3840
               TabIndex        =   116
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   196
               Left            =   5160
               TabIndex        =   115
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   197
               Left            =   6480
               TabIndex        =   114
               Text            =   "Text4"
               Top             =   11760
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   198
               Left            =   240
               TabIndex        =   113
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   199
               Left            =   1560
               TabIndex        =   112
               Text            =   "Text4"
               Top             =   12120
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   200
               Left            =   2280
               TabIndex        =   111
               Text            =   "Text4"
               Top             =   12120
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   201
               Left            =   3840
               TabIndex        =   110
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   202
               Left            =   5160
               TabIndex        =   109
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   203
               Left            =   6480
               TabIndex        =   108
               Text            =   "Text4"
               Top             =   12120
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   204
               Left            =   240
               TabIndex        =   107
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   205
               Left            =   1560
               TabIndex        =   106
               Text            =   "Text4"
               Top             =   12480
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   206
               Left            =   2280
               TabIndex        =   105
               Text            =   "Text4"
               Top             =   12480
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   207
               Left            =   3840
               TabIndex        =   104
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   208
               Left            =   5160
               TabIndex        =   103
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   209
               Left            =   6480
               TabIndex        =   102
               Text            =   "Text4"
               Top             =   12480
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   210
               Left            =   240
               TabIndex        =   101
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   211
               Left            =   1560
               TabIndex        =   100
               Text            =   "Text4"
               Top             =   12840
               Width           =   615
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   212
               Left            =   2280
               TabIndex        =   99
               Text            =   "Text4"
               Top             =   12840
               Width           =   1455
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   213
               Left            =   3840
               TabIndex        =   98
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               Height          =   285
               Index           =   214
               Left            =   5160
               TabIndex        =   97
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
            Begin VB.TextBox Text4 
               Appearance      =   0  'Flat
               BackColor       =   &H0080C0FF&
               Height          =   285
               Index           =   215
               Left            =   6480
               TabIndex        =   96
               Text            =   "Text4"
               Top             =   12840
               Width           =   1215
            End
         End
      End
      Begin VB.VScrollBar VScroll1 
         Height          =   5535
         Left            =   8160
         SmallChange     =   20
         TabIndex        =   82
         Top             =   240
         Value           =   5
         Width           =   375
      End
      Begin VB.Label Label7 
         Alignment       =   2  'Center
         Caption         =   "Fecha"
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   360
         TabIndex        =   88
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label8 
         Alignment       =   2  'Center
         Caption         =   "Número"
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   1680
         TabIndex        =   87
         Top             =   360
         Width           =   2175
      End
      Begin VB.Label Label9 
         Alignment       =   2  'Center
         Caption         =   "Importe"
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   3960
         TabIndex        =   86
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label10 
         Alignment       =   2  'Center
         Caption         =   "Saldo"
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   5280
         TabIndex        =   85
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Label11 
         Alignment       =   2  'Center
         Caption         =   "Aplica"
         ForeColor       =   &H00C00000&
         Height          =   255
         Left            =   6600
         TabIndex        =   84
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.Frame FEfvo 
      Caption         =   "Efectivo"
      ForeColor       =   &H00C00000&
      Height          =   1335
      Left            =   0
      TabIndex        =   10
      Top             =   1800
      Width           =   7215
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   3
         Left            =   2640
         TabIndex        =   11
         Text            =   "Text1"
         Top             =   480
         Width           =   1575
      End
      Begin VB.Label Etiqueta 
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
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   1
         Left            =   1680
         TabIndex        =   12
         Top             =   480
         Width           =   1215
      End
   End
   Begin VB.Frame ChequesPropios 
      Caption         =   "Cheques Propios "
      ForeColor       =   &H00C00000&
      Height          =   5175
      Left            =   0
      TabIndex        =   13
      Top             =   1800
      Width           =   7455
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   43
         Left            =   6000
         TabIndex        =   72
         Text            =   "Text1"
         Top             =   3840
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   42
         Left            =   3240
         TabIndex        =   70
         Text            =   "Text1"
         Top             =   3840
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   41
         Left            =   1320
         TabIndex        =   69
         Text            =   "Text1"
         Top             =   3840
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   40
         Left            =   240
         TabIndex        =   68
         Text            =   "Text1"
         Top             =   3840
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   39
         Left            =   6000
         TabIndex        =   67
         Text            =   "Text1"
         Top             =   3480
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   38
         Left            =   3240
         TabIndex        =   65
         Text            =   "Text1"
         Top             =   3480
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   37
         Left            =   1320
         TabIndex        =   64
         Text            =   "Text1"
         Top             =   3480
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   36
         Left            =   240
         TabIndex        =   63
         Text            =   "Text1"
         Top             =   3480
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   35
         Left            =   6000
         TabIndex        =   62
         Text            =   "Text1"
         Top             =   3120
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   34
         Left            =   3240
         TabIndex        =   60
         Text            =   "Text1"
         Top             =   3120
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   33
         Left            =   1320
         TabIndex        =   59
         Text            =   "Text1"
         Top             =   3120
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   32
         Left            =   240
         TabIndex        =   58
         Text            =   "Text1"
         Top             =   3120
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   44
         Left            =   6000
         TabIndex        =   48
         Text            =   "Text1"
         Top             =   4440
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   31
         Left            =   6000
         TabIndex        =   47
         Text            =   "Text1"
         Top             =   2760
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   30
         Left            =   3240
         TabIndex        =   46
         Text            =   "Text1"
         Top             =   2760
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   29
         Left            =   1320
         TabIndex        =   45
         Text            =   "Text1"
         Top             =   2760
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   28
         Left            =   240
         TabIndex        =   44
         Text            =   "Text1"
         Top             =   2760
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   27
         Left            =   6000
         TabIndex        =   43
         Text            =   "Text1"
         Top             =   2400
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   26
         Left            =   3240
         TabIndex        =   42
         Text            =   "Text1"
         Top             =   2400
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   25
         Left            =   1320
         TabIndex        =   41
         Text            =   "Text1"
         Top             =   2400
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   24
         Left            =   240
         TabIndex        =   40
         Text            =   "Text1"
         Top             =   2400
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   23
         Left            =   6000
         TabIndex        =   39
         Text            =   "Text1"
         Top             =   2040
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   22
         Left            =   3240
         TabIndex        =   38
         Text            =   "Text1"
         Top             =   2040
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   21
         Left            =   1320
         TabIndex        =   37
         Text            =   "Text1"
         Top             =   2040
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   20
         Left            =   240
         TabIndex        =   36
         Text            =   "Text1"
         Top             =   2040
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   19
         Left            =   6000
         TabIndex        =   35
         Text            =   "Text1"
         Top             =   1680
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   18
         Left            =   3240
         TabIndex        =   34
         Text            =   "Text1"
         Top             =   1680
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   17
         Left            =   1320
         TabIndex        =   33
         Text            =   "Text1"
         Top             =   1680
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   16
         Left            =   240
         TabIndex        =   32
         Text            =   "Text1"
         Top             =   1680
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   15
         Left            =   6000
         TabIndex        =   31
         Text            =   "Text1"
         Top             =   1320
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   14
         Left            =   3240
         TabIndex        =   30
         Text            =   "Text1"
         Top             =   1320
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   13
         Left            =   1320
         TabIndex        =   29
         Text            =   "Text1"
         Top             =   1320
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   12
         Left            =   240
         TabIndex        =   28
         Text            =   "Text1"
         Top             =   1320
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   11
         Left            =   6000
         TabIndex        =   27
         Text            =   "Text1"
         Top             =   960
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   10
         Left            =   3240
         TabIndex        =   26
         Text            =   "Text1"
         Top             =   960
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   9
         Left            =   1320
         TabIndex        =   25
         Text            =   "Text1"
         Top             =   960
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   8
         Left            =   240
         TabIndex        =   24
         Text            =   "Text1"
         Top             =   960
         Width           =   975
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   0
         Left            =   4560
         TabIndex        =   23
         Top             =   600
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   7
         Left            =   6000
         TabIndex        =   22
         Text            =   "Text1"
         Top             =   600
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   6
         Left            =   3240
         TabIndex        =   21
         Text            =   "Text1"
         Top             =   600
         Width           =   1215
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   5
         Left            =   1320
         TabIndex        =   20
         Text            =   "Text1"
         Top             =   600
         Width           =   1815
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   4
         Left            =   240
         TabIndex        =   19
         Text            =   "Text1"
         Top             =   600
         Width           =   975
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   1
         Left            =   4560
         TabIndex        =   49
         Top             =   960
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   2
         Left            =   4560
         TabIndex        =   50
         Top             =   1320
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   3
         Left            =   4560
         TabIndex        =   51
         Top             =   1680
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   4
         Left            =   4560
         TabIndex        =   52
         Top             =   2040
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   5
         Left            =   4560
         TabIndex        =   53
         Top             =   2400
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   6
         Left            =   4560
         TabIndex        =   54
         Top             =   2760
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   7
         Left            =   4560
         TabIndex        =   61
         Top             =   3120
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   8
         Left            =   4560
         TabIndex        =   66
         Top             =   3480
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin MSMask.MaskEdBox FechaCHP 
         Height          =   285
         Index           =   9
         Left            =   4560
         TabIndex        =   71
         Top             =   3840
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   503
         _Version        =   393216
         PromptChar      =   "_"
      End
      Begin VB.Label Etiqueta 
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
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   9
         Left            =   3480
         TabIndex        =   57
         Top             =   4440
         Width           =   2415
      End
      Begin VB.Label Etiqueta 
         Alignment       =   2  'Center
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
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   6
         Left            =   5880
         TabIndex        =   18
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Etiqueta 
         Alignment       =   2  'Center
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
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   5
         Left            =   4560
         TabIndex        =   17
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Etiqueta 
         Alignment       =   2  'Center
         Caption         =   "Nro Cheque"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   4
         Left            =   3240
         TabIndex        =   16
         Top             =   360
         Width           =   1215
      End
      Begin VB.Label Etiqueta 
         Alignment       =   2  'Center
         Caption         =   "Banco"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   3
         Left            =   1200
         TabIndex        =   15
         Top             =   360
         Width           =   1815
      End
      Begin VB.Label Etiqueta 
         Alignment       =   2  'Center
         Caption         =   "Cuenta"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   2
         Left            =   120
         TabIndex        =   14
         Top             =   360
         Width           =   1215
      End
   End
   Begin VB.Frame ChTerceros 
      Caption         =   "Cheques de Terceros"
      ForeColor       =   &H00C00000&
      Height          =   6495
      Left            =   120
      TabIndex        =   73
      Top             =   1800
      Width           =   8655
      Begin VB.Frame Frame2 
         Caption         =   "Cheques Aplicados"
         ForeColor       =   &H00C00000&
         Height          =   2535
         Left            =   120
         TabIndex        =   79
         Top             =   2880
         Width           =   8295
         Begin MSComctlLib.ListView CHTerAplic 
            Height          =   2055
            Left            =   720
            TabIndex        =   80
            Top             =   240
            Width           =   6375
            _ExtentX        =   11245
            _ExtentY        =   3625
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
      Begin VB.TextBox Text1 
         Appearance      =   0  'Flat
         Height          =   285
         Index           =   45
         Left            =   5160
         TabIndex        =   74
         Text            =   "Text1"
         Top             =   5760
         Width           =   1335
      End
      Begin VB.Frame Frame1 
         Caption         =   "Cheques En Cartera"
         ForeColor       =   &H00C00000&
         Height          =   2535
         Left            =   120
         TabIndex        =   77
         Top             =   240
         Width           =   8295
         Begin MSComctlLib.ListView ChCartera 
            Height          =   2055
            Left            =   720
            TabIndex        =   78
            Top             =   240
            Width           =   6375
            _ExtentX        =   11245
            _ExtentY        =   3625
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
         ForeColor       =   &H00C00000&
         Height          =   255
         Index           =   10
         Left            =   1680
         TabIndex        =   75
         Top             =   5760
         Width           =   3255
      End
   End
   Begin VB.Label Etiqueta 
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
      ForeColor       =   &H00C00000&
      Height          =   255
      Index           =   13
      Left            =   4200
      TabIndex        =   91
      Top             =   9480
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
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
      ForeColor       =   &H00C00000&
      Height          =   255
      Index           =   12
      Left            =   4200
      TabIndex        =   90
      Top             =   9120
      Width           =   1695
   End
   Begin VB.Label Etiqueta 
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
      ForeColor       =   &H00C00000&
      Height          =   255
      Index           =   11
      Left            =   4200
      TabIndex        =   89
      Top             =   8760
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
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
      ForeColor       =   &H00C00000&
      Height          =   255
      Index           =   8
      Left            =   120
      TabIndex        =   56
      Top             =   120
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
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
      ForeColor       =   &H00C00000&
      Height          =   255
      Index           =   7
      Left            =   3720
      TabIndex        =   55
      Top             =   120
      Width           =   1215
   End
   Begin VB.Label Etiqueta 
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
      ForeColor       =   &H00C00000&
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
    Set rsEncabOP = db.OpenRecordset("EncabOP")
    Set rsChTer = db.OpenRecordset("ChequesTerc")
    Set rsAplicOP = db.OpenRecordset("AplicOP")
    Set rsCtaCteProv = db.OpenRecordset("CtaCteProv")
    Set rsDetOPCHT = db.OpenRecordset("DetOPCHT")
    Set rsDetOPCHP = db.OpenRecordset("DetOPCHPropios")
    Set rsCHEmitidos = db.OpenRecordset("ChEmitidos")
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
        .Update
    End With
    Set rsEncabOP = Nothing
    'graba detalles de cheques propios
    If Not Text1(44) = "0.00" Then
        I = 4: renglon = 0
        For I = I To 40 Step 4
            If Text1(I) = "" Then
                Exit For
            Else
                With rsCHEmitidos
                    .AddNew
                    .Fields("Fecha") = FechaCHP(renglon)
                    .Fields("CtaCte") = Text1(I)
                    .Fields("CodComp") = 1
                    .Fields("NroComp") = Text1(I + 2)
                    .Fields("NroMov") = Text1(0)
                    .Fields("Haber") = Text1(I + 3)
                    .Fields("Estado") = "Pendiente"
                    .Update
                End With
                With rsDetOPCHP
                    .AddNew
                    .Fields("NroOP") = Text1(0)
                    .Fields("Cuenta") = Text1(I)
                    .Fields("Importe") = Text1(I + 3)
                    .Fields("Vto") = FechaCHP(renglon)
                    .Fields("NroCH") = Text1(I + 2)
                    .Update
                End With
                renglon = renglon + 1
            End If
        Next
    End If
    Set rsDetOPCHP = Nothing
    Set rsCtaCteBco = Nothing
    'graba detalle de cheques de terceros
    If Not Text1(45) = "0.00" Then
        I = 0
        For I = I + 1 To CHTerAplic.ListItems.Count
            Set Lista = CHTerAplic.ListItems.Item(I)
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
            Set rsChTer = db.OpenRecordset("Select * From ChequesTerc Where CodBanco = " & rsBcos!CodBco & " and NroCH = " & Lista.Tag & "")
            rsChTer.Edit
            rsChTer.LockEdits = True
            rsChTer.Fields("Estado") = "Orden de Pago"
            rsChTer.Fields("Dado") = Text1(2)
            rsChTer.Update
            rsChTer.LockEdits = False
            Set rsChTer = Nothing
            Set rsBcos = Nothing
        Next
    End If
    Set rsDetOPCHT = Nothing
    'graba detalle de aplicación y acualiza saldo de facturas
    If Not Text1(47) = "0.00" Then
        I = 6
        For I = I To Text4.Count Step 6
            If Not Text4(I - 6) = "" Then
                If Not Text4(I - 1) = "0.00" Then
                    With rsAplicOP
                        .AddNew
                        .Fields("NroOP") = lPrimaryKey
                        .Fields("PtoVta") = Text4(I - 5)
                        .Fields("NroFact") = Text4(I - 4)
                        .Fields("ImpAplic") = Text4(I - 1)
                        .Update
                    End With
                    'acutaliza saldos de facturas
                    Criterio = "CodProv = " & Text1(1) & " and NroComp = " & Text4(I - 4) & ""
                    'rsCtaCteEmp.FindFirst Criterio
                    Set rsCtaCteEmp = Nothing
                    Set rsCtaCteProv = db.OpenRecordset("Select * From CtaCteProv Where CodProv = " & Text1(1) & " and NroComp = " & Val(Text4(I - 4)) & "")
                    rsCtaCteProv.Edit
                    rsCtaCteProv.LockEdits = True
                    rsCtaCteProv!SaldoComp = FormatNumber(rsCtaCteProv!SaldoComp - Text4(I - 1))
                    rsCtaCteProv.Update
                    rsCtaCteProv.LockEdits = False
                End If
            Else
                Exit For
            End If
        Next
        If FormatNumber(Diferencia) > 0 Then
            With rsAplicOP
                .AddNew
                .Fields("NroOP") = lPrimaryKey
                .Fields("Importe") = FormatNumber(Diferencia)
                .Fields("ACta") = "SI"
                .Update
            End With
        End If
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
    Call ImprimeOP(lPrimaryKey)
    Set rsEncabOP = Nothing
    Set rsChTer = Nothing
    Set rsAplicOP = Nothing
    Set rsCtaCteProv = Nothing
    Form_Load
Else
    MsgBox "La aplicación de Facturas no puede suepera al Total del Recibo", vbInformation
End If
End Sub

Private Sub AplicarFact_Click()
FEfvo.Visible = False
ChequesPropios.Visible = False
ChTerceros.Visible = False
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

Private Sub CHProp_Click()
FEfvo.Visible = False
ChequesPropios.Visible = True
ChTerceros.Visible = False
FactPendientes.Visible = False

End Sub

Private Sub CHTerAplic_Click()
Dim x As ListItem
Set x = CHTerAplic.ListItems.Item(ChCartera.SelectedItem.Index)
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
    CHTerAplic.ListItems.Remove (ChCartera.SelectedItem.Index)
End Sub

Private Sub CHTerc_Click()
FEfvo.Visible = False
ChequesPropios.Visible = False
ChTerceros.Visible = True
FactPendientes.Visible = False

End Sub

Private Sub Efectivo_Click()
FEfvo.Visible = True
ChequesPropios.Visible = False
ChTerceros.Visible = False
FactPendientes.Visible = False
Text1(3).SetFocus
End Sub

Private Sub Form_KeyDown(KeyCode As Integer, Shift As Integer)
Select Case KeyCode
Case vbKeyF3: Call Buscar
Case vbKeyF5: Call Aceptar_Click
End Select
End Sub
Private Sub Buscar()

     With BuscFlet
        .Show
        .Height = 6015
        .Width = 6225
        .Top = (Screen.Height - .Height) / 2
        .Left = (Screen.Width - .Width) / 2
        .Viene = "OrdenPago"
    End With

End Sub
Private Sub Form_Load()
TAplic = 0: TCH = 0: TEfvo = 0: Diferencia = 0: TRec = 0: TOConc = 0
Aplic = 0: Efvo = 0: Cheques = 0: OConc = 0: TCHTer = 0
FEfvo.Visible = False
ChequesPropios.Visible = False
ChTerceros.Visible = False
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
I = 0
For I = I + 1 To Text1.Count
    If I > 0 And I < 3 Then
        Text1(I - 1) = ""
    ElseIf I = 4 Then
        Text1(I - 1) = "0.00"
    ElseIf I = 8 Or I = 12 Or I = 16 Or I = 20 Or I = 24 Or I = 28 Or I = 32 Or I = 36 Or I = 40 Or I = 44 Then
        Text1(I - 1) = "0.00"
    ElseIf I = 45 Or I = 46 Or I = 47 Or I = 48 Or I = 49 Then
        Text1(I - 1) = "0.00"
    Else
        Text1(I - 1) = ""
    End If
Next
I = 0
For I = I + 1 To Text4.Count
    If I Mod 6 = 0 Then
        Text4(I - 1) = "0.00"
    Else
        Text4(I - 1) = ""
    End If
Next
I = 0
For I = I + 1 To FechaCHP.Count
    FechaCHP(I - 1).Mask = ""
    FechaCHP(I - 1).Text = ""
    FechaCHP(I - 1).Mask = "##/##/####"
Next
Fecha.Mask = ""
Fecha.Text = ""
Fecha.Mask = "##/##/####"
End Sub

Private Sub Text1_GotFocus(Index As Integer)
Select Case Index
Case 3:
    Efvo = Text2
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
    Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & Text1(1) & " AND TipoProv = 1")
    If Not rsFleteros.EOF And Not rsFleteros.BOF Then
        Text1(2) = rsFleteros!DescFlet
    End If
    Set rsFleteros = Nothing
    'busca facturas con saldo
    Set rsCtaCteProv = db.OpenRecordset("Select * From CtaCteProv Where CodProv = " & Text1(1) & " And SaldoComp > 0 And TipoComp = 1  Order By Fecha")
    x = 0
    I = 0
    For I = I + 1 To Text4.Count
        If I Mod 6 = 0 Then
            Text4(I - 1) = "0.00"
        Else
            Text4(I - 1) = ""
        End If
    Next
    Do While Not rsCtaCteProv.EOF
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
            Case 1: vnro = "0000000" & rsCtaCteProv!NroComp
            Case 2: vnro = "000000" & rsCtaCteProv!NroComp
            Case 3: vnro = "00000" & rsCtaCteProv!NroComp
            Case 4: vnro = "0000" & rsCtaCteProv!NroComp
            Case 5: vnro = "000" & rsCtaCteProv!NroComp
            Case 6: vnro = "00" & rsCtaCteProv!NroComp
            Case 7: vnro = "0" & rsCtaCteProv!NroComp
            Case 8: vnro = rsCtaCteProv!NroComp
        End Select
        Text4(2 + x) = vnro
        Text4(3 + x) = FormatNumber(rsCtaCteProv!Haber)
        Text4(4 + x) = FormatNumber(rsCtaCteProv!SaldoComp)
        Text4(5 + x) = "0.00"
        x = x + 6
        End If
        rsCtaCteProv.MoveNext
    Loop
    Set rsCtaCteProv = Nothing
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
        Text1(47) = FormatNumber(TAplic)
        Text1(48) = FormatNumber(Diferencia)
End Select
End Sub

